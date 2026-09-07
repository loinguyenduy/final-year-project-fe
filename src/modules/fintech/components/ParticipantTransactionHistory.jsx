import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaRedo } from "react-icons/fa";
import axios from "../../../core/api/axiosInstance";
import "./ParticipantTransactionHistory.scss";

const money = (value, currency) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const ParticipantTransactionHistory = () => {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  // Hàm load được sử dụng để tải dữ liệu giao dịch từ API. Nó nhận vào các tham số append và nextCursor để xác định xem có cần thêm dữ liệu vào danh sách hiện tại hay không, và nếu có, thì từ con trỏ nào để tiếp tục tải.
  const load = useCallback(
    async ({ append = false, nextCursor = null } = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      try {
        const response = await axios.get("/fintech/wallets/me/transactions", {
          signal: controller.signal,
          params: {
            limit: 20,
            type,
            status,
            ...(nextCursor ? { cursor: nextCursor } : {}),
          },
        });
        if (requestId !== requestIdRef.current) return;
        setItems((current) =>
          append ? [...current, ...response.DT.items] : response.DT.items,
        );
        setCursor(response.DT.next_cursor);
        setHasMore(response.DT.has_more);
      } catch (requestError) {
        if (
          requestError?.code !== "ERR_CANCELED" &&
          requestId === requestIdRef.current
        )
          setError(requestError?.EM || "Unable to load transaction history.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [status, type],
  );
  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);
  return (
    <section className="participant-history">
      <header>
        <div>
          <h5>Transaction history</h5>
          <p>Canonical Wallet ledger</p>
        </div>
        <div>
          <select
            aria-label="Transaction type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>ALL</option>
            <option>TOP_UP</option>
            <option>DEPOSIT_10</option>
            <option>SERVICE_REMAINING_PAYMENT</option>
            <option>HANDYMAN_PARTIAL_RELEASE</option>
            <option>WARRANTY_RELEASE</option>
            <option>WARRANTY_REFUND</option>
            <option>CANCELLATION_REFUND</option>
            <option>CANCELLATION_COMPENSATION</option>
            <option>BONDING_DEPOSIT</option>
          </select>
          <select
            aria-label="Transaction status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>ALL</option>
            <option>PENDING</option>
            <option>SUCCESS</option>
            <option>FAILED</option>
            <option>EXPIRED</option>
          </select>
        </div>
      </header>
      {loading ? (
        <div className="history-state">Loading transactions...</div>
      ) : error ? (
        <div className="history-state error">
          <span>{error}</span>
          <button onClick={() => load()}>
            <FaRedo /> Retry
          </button>
        </div>
      ) : !items.length ? (
        <div className="history-state">No transactions yet.</div>
      ) : (
        <div className="canonical-history-list">
          {items.map((item) => {
            const Icon =
              item.direction === "INCOMING"
                ? FaArrowDown
                : item.direction === "OUTGOING"
                  ? FaArrowUp
                  : FaArrowRight;
            return (
              <article key={item.transaction_id}>
                <span
                  className={`history-icon ${item.direction.toLowerCase()}`}
                >
                  <Icon />
                </span>
                <div className="history-copy">
                  <strong>{item.friendly_description}</strong>
                  <small>
                    {item.related_job?.display_title ||
                      item.counterparty?.label ||
                      "Wallet activity"}
                  </small>
                  <small>
                    {new Date(item.created_at).toLocaleString()} · {item.status}
                  </small>
                </div>
                <strong
                  className={`history-amount ${item.direction.toLowerCase()}`}
                >
                  {item.direction === "INCOMING"
                    ? "+"
                    : item.direction === "OUTGOING"
                      ? "−"
                      : ""}
                  {money(item.amount, item.currency)}
                </strong>
              </article>
            );
          })}
        </div>
      )}
      {hasMore && (
        <button
          className="history-load-more"
          disabled={loadingMore}
          onClick={() => load({ append: true, nextCursor: cursor })}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </section>
  );
};
export default ParticipantTransactionHistory;
