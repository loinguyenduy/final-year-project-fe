import React from 'react';
import { FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import {
  INSPECTION_QUOTE_LIMITS,
  QUOTE_ITEM_TYPE_OPTIONS,
  QUOTE_UNIT_SUGGESTIONS,
  QUOTE_VARIANCE_REASON_OPTIONS,
  READINESS_LABELS,
} from '../constants/inspectionQuote.constants';
import { formatCurrency } from '../utils/jobLifecycleUi';

const QuoteDraftEditor = ({
  canSubmit,
  quoteState,
  readiness,
  onRequestSubmit,
}) => {
  const {
    addItem,
    form,
    formError,
    hasUnsavedChanges,
    preview,
    quote,
    removeItem,
    saveDraft,
    saving,
    setFormError,
    updateField,
    updateItem,
  } = quoteState;
  const missingRequirements = readiness?.missing_requirements || [];
  const showUnsavedPreview = hasUnsavedChanges;
  const subtotal = showUnsavedPreview ? preview.subtotal : quote.subtotal_amount;
  const total = showUnsavedPreview ? preview.total : quote.total_amount;
  const showVarianceReason = Boolean(
    readiness?.variance_reason_required
    || quote.variance_reason
    || form.variance_reason,
  );

  const handleSubmitClick = () => {
    if (hasUnsavedChanges) {
      setFormError('Save your Draft before submitting. Submit never saves changes automatically.');
      return;
    }
    onRequestSubmit();
  };

  return (
    <section className="inspection-section" aria-labelledby="quote-editor-title">
      <div className="inspection-section__header">
        <div>
          <span className="lifecycle-stage__eyebrow">Final quote</span>
          <h3 id="quote-editor-title">Inspection report and Quote Draft</h3>
          <p>
            Save changes to let the backend recalculate canonical totals, readiness,
            and allowed actions.
          </p>
        </div>
        <span className="inspection-section__count">
          Draft r{quote.draft_revision}
        </span>
      </div>

      <div className="quote-form-grid">
        <label className="lifecycle-field quote-form-grid__wide">
          <span>Problem summary</span>
          <textarea
            rows="3"
            maxLength={INSPECTION_QUOTE_LIMITS.reportTextMaxLength}
            value={form.problem_summary}
            onChange={(event) => updateField('problem_summary', event.target.value)}
            placeholder="Summarize the problem found during inspection."
          />
          <small>{form.problem_summary.length}/{INSPECTION_QUOTE_LIMITS.reportTextMaxLength}</small>
        </label>

        <label className="lifecycle-field quote-form-grid__wide">
          <span>Inspection notes <em>Optional</em></span>
          <textarea
            rows="3"
            maxLength={INSPECTION_QUOTE_LIMITS.reportTextMaxLength}
            value={form.inspection_notes}
            onChange={(event) => updateField('inspection_notes', event.target.value)}
            placeholder="Add useful on-site observations."
          />
          <small>{form.inspection_notes.length}/{INSPECTION_QUOTE_LIMITS.reportTextMaxLength}</small>
        </label>

        <label className="lifecycle-field quote-form-grid__wide">
          <span>Recommended solution</span>
          <textarea
            rows="3"
            maxLength={INSPECTION_QUOTE_LIMITS.reportTextMaxLength}
            value={form.recommended_solution}
            onChange={(event) => updateField('recommended_solution', event.target.value)}
            placeholder="Explain the proposed repair or service."
          />
          <small>{form.recommended_solution.length}/{INSPECTION_QUOTE_LIMITS.reportTextMaxLength}</small>
        </label>

        <fieldset className="quote-duration-field">
          <legend>Estimated duration</legend>
          <label>
            <span>Hours</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={form.duration_hours}
              onChange={(event) => updateField('duration_hours', event.target.value)}
            />
          </label>
          <label>
            <span>Minutes</span>
            <input
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              value={form.duration_minutes}
              onChange={(event) => updateField('duration_minutes', event.target.value)}
            />
          </label>
          <small>Minutes must be 0–59; total duration must be 1–43,200 minutes.</small>
        </fieldset>

      </div>

      <div className="quote-items">
        <div className="quote-items__header">
          <div>
            <h4>Quote items</h4>
            <p>Quantity is a positive whole number. Prices are integer VND.</p>
          </div>
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--secondary lifecycle-btn--compact"
            onClick={addItem}
            disabled={form.items.length >= INSPECTION_QUOTE_LIMITS.quoteMaxItems}
          >
            <FaPlus aria-hidden="true" /> Add item
          </button>
        </div>

        {form.items.length === 0 && (
          <div className="inspection-empty">No Quote items have been added yet.</div>
        )}

        <div className="quote-items__list">
          {form.items.map((item, index) => (
            <article className="quote-item-editor" key={item.client_id}>
              <div className="quote-item-editor__heading">
                <strong>Item {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => removeItem(item.client_id)}
                  aria-label={`Remove Quote item ${index + 1}`}
                >
                  <FaTrash aria-hidden="true" />
                </button>
              </div>
              <div className="quote-item-editor__grid">
                <label className="lifecycle-field">
                  <span>Type</span>
                  <select
                    value={item.item_type}
                    onChange={(event) => updateItem(item.client_id, 'item_type', event.target.value)}
                  >
                    {QUOTE_ITEM_TYPE_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="lifecycle-field quote-item-editor__name">
                  <span>Name</span>
                  <input
                    type="text"
                    maxLength={INSPECTION_QUOTE_LIMITS.itemNameMaxLength}
                    value={item.name}
                    onChange={(event) => updateItem(item.client_id, 'name', event.target.value)}
                    placeholder="Labour, replacement valve, cable..."
                  />
                </label>
                <label className="lifecycle-field quote-item-editor__description">
                  <span>Description <em>Optional</em></span>
                  <textarea
                    rows="2"
                    maxLength={INSPECTION_QUOTE_LIMITS.itemDescriptionMaxLength}
                    value={item.description}
                    onChange={(event) => updateItem(item.client_id, 'description', event.target.value)}
                  />
                </label>
                <label className="lifecycle-field">
                  <span>Quantity</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.client_id, 'quantity', event.target.value)}
                    placeholder="1"
                  />
                </label>
                <label className="lifecycle-field">
                  <span>Unit</span>
                  <input
                    type="text"
                    list="quote-unit-suggestions"
                    maxLength={INSPECTION_QUOTE_LIMITS.itemUnitMaxLength}
                    value={item.unit}
                    onChange={(event) => updateItem(item.client_id, 'unit', event.target.value)}
                    placeholder="job, hour, item…"
                  />
                </label>
                <label className="lifecycle-field">
                  <span>Unit price (VND)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.unit_price}
                    onChange={(event) => updateItem(item.client_id, 'unit_price', event.target.value)}
                  />
                </label>
                <div className="quote-item-editor__line-total">
                  <span>{showUnsavedPreview ? 'Preview line total' : 'Canonical line total'}</span>
                  <strong>
                    {formatCurrency(
                      showUnsavedPreview
                        ? preview.lineTotals[index]
                        : quote.items?.[index]?.line_total,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
        <datalist id="quote-unit-suggestions">
          {QUOTE_UNIT_SUGGESTIONS.map((unit) => <option value={unit} key={unit} />)}
        </datalist>
      </div>

      {showVarianceReason && (
        <div className="quote-form-grid quote-form-grid--financial">
          <div className="lifecycle-notice lifecycle-notice--warning quote-form-grid__wide">
            The saved Quote total is more than 50% above the selected Bid. Choose a reason,
            then Save Draft again so the backend can verify readiness.
          </div>
          <label className="lifecycle-field">
            <span>Variance reason</span>
            <select
              value={form.variance_reason}
              onChange={(event) => updateField('variance_reason', event.target.value)}
            >
              <option value="">Select a reason</option>
              {QUOTE_VARIANCE_REASON_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {form.variance_reason && (
            <label className="lifecycle-field quote-form-grid__wide">
              <span>
                Variance explanation
                {form.variance_reason === 'OTHER' && <strong aria-hidden="true"> *</strong>}
              </span>
              <textarea
                rows="3"
                maxLength={INSPECTION_QUOTE_LIMITS.varianceReasonTextMaxLength}
                value={form.variance_reason_text}
                onChange={(event) => updateField('variance_reason_text', event.target.value)}
              />
              <small>
                {form.variance_reason_text.length}/{INSPECTION_QUOTE_LIMITS.varianceReasonTextMaxLength}
              </small>
            </label>
          )}
        </div>
      )}

      <div className="quote-totals">
        <div>
          <span>{showUnsavedPreview ? 'Unsaved subtotal preview' : 'Canonical subtotal'}</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="quote-totals__total">
          <span>{showUnsavedPreview ? 'Unsaved total preview' : 'Canonical total'}</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div>
          <span>Selected Bid reference</span>
          <strong>{formatCurrency(quote.bid_reference_amount)}</strong>
        </div>
        <div>
          <span>Difference after last Save</span>
          <strong>
            {formatCurrency(quote.variance_amount)} ({quote.variance_percent || '0'}%)
          </strong>
        </div>
        {showUnsavedPreview && (
          <p>
            Preview uses integer-string arithmetic.
            Backend totals become canonical only after Save Draft.
          </p>
        )}
      </div>

      <div className={`quote-readiness ${readiness?.ready ? 'quote-readiness--ready' : ''}`}>
        <strong>{readiness?.ready ? 'Saved Draft is ready to submit' : 'Saved Draft readiness'}</strong>
        {missingRequirements.length > 0 ? (
          <ul>
            {missingRequirements.map((requirement) => (
              <li key={requirement}>{READINESS_LABELS[requirement] || 'Complete the missing backend requirement.'}</li>
            ))}
          </ul>
        ) : (
          <p>All backend readiness checks currently pass.</p>
        )}
        {hasUnsavedChanges && (
          <p className="quote-readiness__unsaved">
            You have unsaved changes. Save first; Submit will not save automatically.
          </p>
        )}
      </div>

      {formError && <div className="lifecycle-notice lifecycle-notice--danger" role="alert">{formError}</div>}

      <div className="lifecycle-stage__primary-bar lifecycle-stage__primary-bar--split">
        <button
          type="button"
          className="lifecycle-btn lifecycle-btn--secondary"
          onClick={() => void saveDraft()}
          disabled={saving || !hasUnsavedChanges}
        >
          <FaSave aria-hidden="true" />
          {saving ? 'Saving Draft…' : 'Save Draft'}
        </button>
        {canSubmit && (
          <button
            type="button"
            className="lifecycle-btn lifecycle-btn--primary"
            onClick={handleSubmitClick}
          >
            Submit Quote
          </button>
        )}
      </div>

      {!canSubmit && (
        <p className="lifecycle-stage__helper">
          Save the Draft and complete every readiness requirement before submission becomes available.
        </p>
      )}
    </section>
  );
};

export default QuoteDraftEditor;
