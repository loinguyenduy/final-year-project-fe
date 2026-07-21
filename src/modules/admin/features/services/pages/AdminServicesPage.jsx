import React, { useCallback, useEffect, useState } from 'react';
import { FaPlus, FaSearch, FaTools } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AdminModal from '../../../components/AdminModal';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../components/AdminStates';
import { createAdminService, getAdminServices, setAdminServiceActive, updateAdminService } from '../../../services/adminServiceService';
import './AdminServices.scss';

const DEFAULTS = { page: '1', page_size: '20', search: '', is_active: 'ALL', sort: 'NAME_ASC' };
const blankForm = { service_code: '', name: '', icon_url: '', is_active: true };

const AdminServicesPage = () => {
  const [filters, setFilters] = useState(DEFAULTS);
  const [draftSearch, setDraftSearch] = useState('');
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(blankForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => current.search === draftSearch ? current : { ...current, search: draftSearch, page: '1' }), 300);
    return () => clearTimeout(timer);
  }, [draftSearch]);

  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { setData((await getAdminServices(filters, signal)).DT); }
    catch (requestError) { if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.EM || 'Unable to load Services.'); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(blankForm); };
  const openEdit = (service) => { setEditing(service); setForm({ service_code: service.service_code, name: service.name, icon_url: service.icon_url || '', is_active: service.is_active }); };
  const closeEditor = () => { if (!submitting) { setEditing(undefined); setForm(blankForm); } };
  const save = async (event) => {
    event.preventDefault(); setSubmitting(true);
    try {
      if (editing) await updateAdminService(editing.id, { name: form.name, icon_url: form.icon_url || null });
      else await createAdminService({ service_code: form.service_code, name: form.name, icon_url: form.icon_url || null, is_active: form.is_active });
      toast.success(`Service ${editing ? 'updated' : 'created'} successfully.`);
      setEditing(undefined); setForm(blankForm); await load();
    } catch (requestError) { toast.error(requestError?.EM || 'Service could not be saved.'); }
    finally { setSubmitting(false); }
  };
  const changeStatus = async () => {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      await setAdminServiceActive(statusTarget.id, !statusTarget.is_active);
      toast.success(`Service ${statusTarget.is_active ? 'deactivated' : 'activated'} successfully.`);
      setStatusTarget(null); await load();
    } catch (requestError) { toast.error(requestError?.EM || 'Service status could not be changed.'); await load(); }
    finally { setSubmitting(false); }
  };
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: '1' }) }));
  const editorOpen = editing !== undefined;

  return <div className="admin-services-page">
    <PageHeader title="Services" description="Manage the canonical service catalogue. Existing Jobs remain linked when a Service is inactive." aside={<button className="service-primary" onClick={openCreate}><FaPlus /> Create service</button>} />
    <div className="service-filters">
      <label><FaSearch /><span className="visually-hidden">Search Services</span><input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search code or name" /></label>
      <select aria-label="Service status" value={filters.is_active} onChange={(event) => setFilter('is_active', event.target.value)}><option value="ALL">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
      <select aria-label="Service sorting" value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)}><option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="CODE_ASC">Code A–Z</option><option value="CODE_DESC">Code Z–A</option></select>
    </div>
    {loading ? <LoadingState message="Loading Services..." /> : error ? <ErrorState message={error} onRetry={() => load()} /> : !data.items.length ? <EmptyState icon={<FaTools />} message="No Services match these filters." /> : <>
      <div className="service-grid">{data.items.map((service) => <article className="service-item" key={service.id}>
        <div className="service-icon">{service.icon_url ? <img src={service.icon_url} alt="" /> : <FaTools />}</div>
        <div className="service-copy"><div><code>{service.service_code}</code><StatusBadge status={service.is_active ? 'ACTIVE' : 'INACTIVE'} /></div><h2>{service.name}</h2><dl><div><dt>Jobs</dt><dd>{service.usage.total_jobs} total · {service.usage.active_jobs} active</dd></div><div><dt>Handymen</dt><dd>{service.usage.total_handyman_associations} linked · {service.usage.active_handyman_associations} active</dd></div></dl></div>
        <div className="service-actions"><button onClick={() => openEdit(service)}>Edit</button><button className={service.is_active ? 'danger' : ''} onClick={() => setStatusTarget(service)}>{service.is_active ? 'Deactivate' : 'Activate'}</button></div>
      </article>)}</div>
      <div className="service-pagination"><span>{data.pagination.total_items} Services</span><button disabled={data.pagination.page <= 1} onClick={() => setFilter('page', String(data.pagination.page - 1))}>Previous</button><span>Page {data.pagination.page}/{data.pagination.total_pages || 1}</span><button disabled={data.pagination.page >= data.pagination.total_pages} onClick={() => setFilter('page', String(data.pagination.page + 1))}>Next</button></div>
    </>}

    <AdminModal open={editorOpen} titleId="service-editor-title" submitting={submitting} onClose={closeEditor} className="service-modal"><form onSubmit={save}>
      <header><div><span>Service catalogue</span><h2 id="service-editor-title">{editing ? 'Edit service' : 'Create service'}</h2></div><button type="button" aria-label="Close" onClick={closeEditor}>×</button></header>
      <div className="service-modal-body">
        <label>Service code<input value={form.service_code} disabled={Boolean(editing)} required minLength={2} maxLength={50} pattern="[A-Z0-9_]+" onChange={(event) => setForm({ ...form, service_code: event.target.value.toUpperCase() })} /><small>Uppercase letters, digits and underscores. This value is immutable.</small></label>
        <label>Name<input value={form.name} required minLength={2} maxLength={100} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Icon HTTPS URL<input type="url" value={form.icon_url} maxLength={2048} placeholder="https://..." onChange={(event) => setForm({ ...form, icon_url: event.target.value })} /></label>
        {!editing && <label className="service-checkbox"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active immediately</label>}
      </div><footer><button type="button" onClick={closeEditor}>Cancel</button><button className="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save service'}</button></footer>
    </form></AdminModal>

    <AdminModal open={Boolean(statusTarget)} titleId="service-status-title" submitting={submitting} onClose={() => setStatusTarget(null)} className="service-modal compact"><div className="service-confirm"><h2 id="service-status-title">{statusTarget?.is_active ? 'Deactivate' : 'Activate'} Service?</h2><p>{statusTarget?.is_active ? 'The Service will disappear from new selections. Existing Jobs and associations continue normally.' : 'The Service will become available for new Jobs and Handyman associations.'}</p><footer><button onClick={() => setStatusTarget(null)}>Cancel</button><button className={statusTarget?.is_active ? 'danger' : 'primary'} disabled={submitting} onClick={changeStatus}>{submitting ? 'Saving...' : 'Confirm'}</button></footer></div></AdminModal>
  </div>;
};

export default AdminServicesPage;
