import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  createOrGetConversationApi,
  getConversationByJobApi,
  getConversationMessagesApi,
} from '../api/chatApi';
import {
  CHAT_ACCESS_STATES,
  CHAT_CONNECTION_STATES,
  CHAT_EVENTS,
  MESSAGE_DELIVERY_STATES,
} from '../constants/chat.constants';
import { acquireChatSocket, emitWithAcknowledgement } from '../socket/chatSocket';
import {
  compareMessagePosition,
  createClientMessageId,
  getErrorEnvelope,
  getFriendlyChatError,
  isSameLogicalMessage,
  mergeMessages,
  normalizeMessageContent,
  updateMessageByClientId,
} from '../utils/chatMessage';

const createInitialState = () => ({
  discoveryStatus: 'idle',
  opening: false,
  conversation: null,
  accessState: CHAT_ACCESS_STATES.ACTIVE,
  accessDetails: null,
  connectionState: CHAT_CONNECTION_STATES.IDLE,
  joined: false,
  messages: [],
  historyLoaded: false,
  historyLoading: false,
  paginationLoading: false,
  paginationError: null,
  nextCursor: null,
  hasMore: false,
  unreadCount: 0,
  composerError: null,
  generalError: null,
  cooldownUntil: 0,
});

const isHistoryOnlyConversation = (conversation) => (
  conversation?.status === 'CLOSED'
  && Array.isArray(conversation.allowed_actions)
  && conversation.allowed_actions.includes('HISTORY')
);

const getClosedAccessDetails = (conversation, fallback = null) => ({
  code: 'CONVERSATION_CLOSED',
  message: 'This conversation is closed. You can still review its message history.',
  ...(fallback || {}),
  ...(conversation?.closed_reason ? { reason: conversation.closed_reason } : {}),
  ...(conversation?.closed_at ? { closed_at: conversation.closed_at } : {}),
});

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'DISCOVERY_START':
      return {
        ...state,
        discoveryStatus: state.conversation ? state.discoveryStatus : 'loading',
        generalError: null,
      };
    case 'NO_CONVERSATION':
      return {
        ...state,
        discoveryStatus: 'none',
        conversation: null,
        connectionState: CHAT_CONNECTION_STATES.IDLE,
        joined: false,
        messages: [],
        historyLoaded: false,
        historyLoading: false,
        paginationLoading: false,
        paginationError: null,
        nextCursor: null,
        hasMore: false,
        unreadCount: 0,
        accessState: CHAT_ACCESS_STATES.ACTIVE,
        accessDetails: null,
        generalError: null,
      };
    case 'CONVERSATION_READY': {
      const historyOnly = isHistoryOnlyConversation(action.conversation);
      return {
        ...state,
        discoveryStatus: 'ready',
        opening: false,
        conversation: action.conversation,
        unreadCount: historyOnly ? 0 : Number(action.conversation.unread_count || 0),
        accessState: historyOnly
          ? CHAT_ACCESS_STATES.CLOSED
          : CHAT_ACCESS_STATES.ACTIVE,
        accessDetails: historyOnly
          ? getClosedAccessDetails(
              action.conversation,
              state.accessState === CHAT_ACCESS_STATES.CLOSED ? state.accessDetails : null,
            )
          : null,
        connectionState: historyOnly
          ? CHAT_CONNECTION_STATES.IDLE
          : state.connectionState,
        joined: historyOnly ? false : state.joined,
        composerError: historyOnly ? null : state.composerError,
        generalError: null,
      };
    }
    case 'OPEN_START':
      return { ...state, opening: true, generalError: null };
    case 'OPEN_END':
      return { ...state, opening: false };
    case 'CONNECTION_STATE':
      return {
        ...state,
        connectionState: action.connectionState,
        joined: action.connectionState === CHAT_CONNECTION_STATES.CONNECTED
          ? state.joined
          : false,
      };
    case 'JOIN_SUCCESS':
      return {
        ...state,
        joined: true,
        connectionState: CHAT_CONNECTION_STATES.CONNECTED,
        conversation: action.conversation || state.conversation,
        unreadCount: action.conversation
          ? Number(action.conversation.unread_count || 0)
          : state.unreadCount,
        accessState: CHAT_ACCESS_STATES.ACTIVE,
        accessDetails: null,
        generalError: null,
      };
    case 'ACCESS_INACTIVE':
      return {
        ...state,
        opening: false,
        accessState: CHAT_ACCESS_STATES.INACTIVE,
        accessDetails: action.details,
        connectionState: CHAT_CONNECTION_STATES.DISCONNECTED,
        joined: false,
        messages: [],
        historyLoaded: false,
        historyLoading: false,
        paginationLoading: false,
        paginationError: null,
        unreadCount: 0,
        generalError: null,
      };
    case 'ACCESS_CLOSED':
      return {
        ...state,
        opening: false,
        accessState: CHAT_ACCESS_STATES.CLOSED,
        accessDetails: getClosedAccessDetails(state.conversation, action.details),
        conversation: state.conversation
          ? {
              ...state.conversation,
              status: 'CLOSED',
              allowed_actions: ['HISTORY'],
            }
          : state.conversation,
        connectionState: CHAT_CONNECTION_STATES.DISCONNECTED,
        joined: false,
        historyLoading: false,
        paginationLoading: false,
        unreadCount: 0,
        composerError: null,
        generalError: null,
      };
    case 'ACCESS_UNAVAILABLE':
      return {
        ...state,
        opening: false,
        accessState: CHAT_ACCESS_STATES.UNAVAILABLE,
        accessDetails: action.details,
        historyLoading: false,
        paginationLoading: false,
        generalError: null,
      };
    case 'GENERAL_ERROR':
      return {
        ...state,
        opening: false,
        historyLoading: false,
        generalError: action.message,
      };
    case 'CLEAR_GENERAL_ERROR':
      return { ...state, generalError: null };
    case 'HISTORY_START':
      return { ...state, historyLoading: true, paginationError: null };
    case 'HISTORY_SUCCESS': {
      const localMessages = action.reset
        ? state.messages.filter((message) => !message.id)
        : state.messages;
      return {
        ...state,
        historyLoading: false,
        historyLoaded: true,
        messages: mergeMessages(localMessages, action.messages),
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        paginationError: null,
      };
    }
    case 'PAGINATION_START':
      return { ...state, paginationLoading: true, paginationError: null };
    case 'PAGINATION_SUCCESS':
      return {
        ...state,
        paginationLoading: false,
        messages: mergeMessages(state.messages, action.messages),
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        paginationError: null,
      };
    case 'PAGINATION_ERROR':
      return {
        ...state,
        paginationLoading: false,
        paginationError: action.message,
      };
    case 'MESSAGE_OPTIMISTIC':
      return {
        ...state,
        messages: mergeMessages(state.messages, [action.message]),
        composerError: null,
      };
    case 'MESSAGE_CONFIRMED':
      return {
        ...state,
        messages: mergeMessages(state.messages, [action.message]),
        composerError: null,
      };
    case 'MESSAGE_RETRYING':
      return {
        ...state,
        messages: updateMessageByClientId(state.messages, action.clientMessageId, {
          delivery_status: MESSAGE_DELIVERY_STATES.SENDING,
          delivery_error: null,
          delivery_error_code: null,
        }),
      };
    case 'MESSAGE_FAILED':
      return {
        ...state,
        messages: updateMessageByClientId(state.messages, action.clientMessageId, {
          delivery_status: MESSAGE_DELIVERY_STATES.FAILED,
          delivery_error: action.message,
          delivery_error_code: action.code,
          retryable: action.retryable,
        }),
      };
    case 'MESSAGE_REMOVED':
      return {
        ...state,
        messages: state.messages.filter(
          (message) => message.client_message_id !== action.clientMessageId,
        ),
      };
    case 'MESSAGE_RECEIVED': {
      const alreadyPresent = state.messages.some((message) => (
        isSameLogicalMessage(message, action.message)
      ));
      return {
        ...state,
        messages: mergeMessages(state.messages, [action.message]),
        unreadCount: action.incrementUnread && !alreadyPresent
          ? state.unreadCount + 1
          : state.unreadCount,
      };
    }
    case 'READ_SUCCESS':
      return {
        ...state,
        conversation: state.conversation
          ? {
              ...state.conversation,
              current_user_last_read_message_id: action.lastReadMessageId,
              current_user_last_read_at: action.readAt,
              unread_count: 0,
            }
          : state.conversation,
        unreadCount: 0,
      };
    case 'PARTNER_READ_UPDATED': {
      const cursorMessage = state.messages.find(
        (message) => message.id === action.lastReadMessageId,
      );
      const messages = cursorMessage
        ? state.messages.map((message) => (
            message.sender_id === action.currentUserId
              && message.id
              && compareMessagePosition(message, cursorMessage) <= 0
              ? { ...message, is_seen: true, seen_at: action.readAt }
              : message
          ))
        : state.messages;

      return {
        ...state,
        conversation: state.conversation
          ? {
              ...state.conversation,
              partner_last_read_message_id: action.lastReadMessageId,
              partner_last_read_at: action.readAt,
            }
          : state.conversation,
        messages,
      };
    }
    case 'COMPOSER_ERROR':
      return { ...state, composerError: action.message };
    case 'CLEAR_COMPOSER_ERROR':
      return { ...state, composerError: null };
    case 'RATE_LIMITED':
      return { ...state, cooldownUntil: action.cooldownUntil };
    case 'CLEAR_COOLDOWN':
      return { ...state, cooldownUntil: 0 };
    default:
      return state;
  }
};

const useJobChat = ({
  jobId,
  currentUserId,
  accessToken,
  historyOnlyExpected = false,
  isOpen,
}) => {
  const [state, dispatch] = useReducer(chatReducer, undefined, createInitialState);
  const [clock, setClock] = useState(Date.now());
  const socketRef = useRef(null);
  const stateRef = useRef(state);
  const isOpenRef = useRef(isOpen);
  const atBottomRef = useRef(true);
  const readInFlightRef = useRef(false);
  const lastReadRequestedRef = useRef(null);
  const discoveryRequestRef = useRef(0);

  stateRef.current = state;
  isOpenRef.current = isOpen;

  const applyAccessError = useCallback((rawError) => {
    const envelope = getErrorEnvelope(rawError);
    const details = {
      code: envelope.code,
      message: getFriendlyChatError(envelope),
      ...(envelope.DT && typeof envelope.DT === 'object' ? envelope.DT : {}),
    };

    if (envelope.code === 'PARTICIPANT_INACTIVE') {
      dispatch({ type: 'ACCESS_INACTIVE', details });
      return true;
    }
    if (envelope.code === 'CONVERSATION_CLOSED') {
      dispatch({ type: 'ACCESS_CLOSED', details });
      return true;
    }
    if (['CHAT_NOT_ALLOWED_FOR_JOB_STATUS', 'ACCEPTANCE_CYCLE_INCONSISTENT', 'ACCEPTED_DATA_INCONSISTENT'].includes(envelope.code)) {
      dispatch({ type: 'ACCESS_UNAVAILABLE', details });
      return true;
    }
    return false;
  }, []);

  const discoverConversation = useCallback(async ({ silent = false } = {}) => {
    if (!jobId) return null;
    const requestVersion = ++discoveryRequestRef.current;
    if (!silent) dispatch({ type: 'DISCOVERY_START' });

    try {
      const response = await getConversationByJobApi(jobId);
      if (response?.EC === 0 && response.DT?.conversation) {
        if (requestVersion !== discoveryRequestRef.current) {
          return response.DT.conversation;
        }
        dispatch({
          type: 'CONVERSATION_READY',
          conversation: response.DT.conversation,
        });
        return response.DT.conversation;
      }
      return null;
    } catch (error) {
      if (requestVersion !== discoveryRequestRef.current) return null;
      const envelope = getErrorEnvelope(error);
      if (envelope.code === 'CONVERSATION_NOT_FOUND') {
        dispatch({ type: 'NO_CONVERSATION' });
        return null;
      }
      if (!applyAccessError(envelope)) {
        dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(envelope) });
      }
      return null;
    }
  }, [applyAccessError, jobId]);

  const fetchLatestHistory = useCallback(async (conversationId, { reset = true } = {}) => {
    if (!conversationId) return false;
    dispatch({ type: 'HISTORY_START' });

    try {
      const response = await getConversationMessagesApi(conversationId);
      if (response?.EC !== 0) throw response;
      dispatch({
        type: 'HISTORY_SUCCESS',
        messages: response.DT.messages || [],
        nextCursor: response.DT.next_cursor || null,
        hasMore: Boolean(response.DT.has_more),
        reset,
      });
      return true;
    } catch (error) {
      if (!applyAccessError(error)) {
        dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(error) });
      }
      return false;
    }
  }, [applyAccessError]);

  const openConversation = useCallback(async () => {
    discoveryRequestRef.current += 1;
    dispatch({ type: 'OPEN_START' });
    let conversation = stateRef.current.conversation;

    try {
      if (!conversation) {
        try {
          const discoveryResponse = await getConversationByJobApi(jobId);
          if (discoveryResponse?.EC !== 0 || !discoveryResponse.DT?.conversation) {
            throw discoveryResponse;
          }
          conversation = discoveryResponse.DT.conversation;
          dispatch({ type: 'CONVERSATION_READY', conversation });
        } catch (discoveryError) {
          const envelope = getErrorEnvelope(discoveryError);
          if (envelope.code !== 'CONVERSATION_NOT_FOUND') throw discoveryError;
        }
      }

      if (!conversation && historyOnlyExpected) {
        dispatch({
          type: 'ACCESS_CLOSED',
          details: {
            code: 'CONVERSATION_CLOSED',
            message: 'This job is complete and no conversation history is available.',
          },
        });
        return true;
      }

      if (!conversation || (
        !isHistoryOnlyConversation(conversation)
        && stateRef.current.accessState !== CHAT_ACCESS_STATES.ACTIVE
      )) {
        const response = await createOrGetConversationApi(jobId);
        if (response?.EC !== 0 || !response.DT?.conversation) throw response;
        conversation = response.DT.conversation;
        dispatch({ type: 'CONVERSATION_READY', conversation });
      } else {
        dispatch({ type: 'OPEN_END' });
      }

      if (!stateRef.current.historyLoaded || stateRef.current.conversation?.id !== conversation.id) {
        await fetchLatestHistory(conversation.id, { reset: true });
      }
      return true;
    } catch (error) {
      dispatch({ type: 'OPEN_END' });
      if (!applyAccessError(error)) {
        dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(error) });
      }
      return false;
    }
  }, [applyAccessError, fetchLatestHistory, historyOnlyExpected, jobId]);

  const loadOlderMessages = useCallback(async () => {
    const current = stateRef.current;
    if (!current.conversation?.id
      || !current.hasMore
      || !current.nextCursor
      || current.paginationLoading) {
      return false;
    }

    dispatch({ type: 'PAGINATION_START' });
    try {
      const response = await getConversationMessagesApi(current.conversation.id, {
        cursor: current.nextCursor,
      });
      if (response?.EC !== 0) throw response;
      dispatch({
        type: 'PAGINATION_SUCCESS',
        messages: response.DT.messages || [],
        nextCursor: response.DT.next_cursor || null,
        hasMore: Boolean(response.DT.has_more),
      });
      return true;
    } catch (error) {
      const envelope = getErrorEnvelope(error);
      if (!applyAccessError(envelope)) {
        dispatch({
          type: 'PAGINATION_ERROR',
          message: getFriendlyChatError(envelope),
        });
      }
      return false;
    }
  }, [applyAccessError]);

  const joinActiveSocket = useCallback(async () => {
    const socket = socketRef.current;
    const conversationId = stateRef.current.conversation?.id;
    if (!socket?.connected || !conversationId) return false;

    try {
      const response = await emitWithAcknowledgement(socket, CHAT_EVENTS.JOIN, {
        conversation_id: conversationId,
      });
      if (response?.EC !== 0) throw response;
      dispatch({
        type: 'JOIN_SUCCESS',
        conversation: response.DT?.conversation || null,
      });
      return true;
    } catch (error) {
      if (!applyAccessError(error)) {
        dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(error) });
      }
      return false;
    }
  }, [applyAccessError]);

  const markReadIfAppropriate = useCallback(async ({ allowRejoin = true } = {}) => {
    const current = stateRef.current;
    if (!isOpenRef.current
      || document.visibilityState !== 'visible'
      || !atBottomRef.current
      || current.accessState !== CHAT_ACCESS_STATES.ACTIVE
      || !current.conversation?.id
      || !socketRef.current?.connected
      || readInFlightRef.current) {
      return false;
    }

    const targetMessage = [...current.messages].reverse().find((message) => message.id);
    if (!targetMessage
      || targetMessage.id === current.conversation.current_user_last_read_message_id
      || targetMessage.id === lastReadRequestedRef.current) {
      return false;
    }

    if (!current.joined) {
      if (!allowRejoin || !(await joinActiveSocket())) return false;
    }

    readInFlightRef.current = true;
    lastReadRequestedRef.current = targetMessage.id;
    try {
      const response = await emitWithAcknowledgement(socketRef.current, CHAT_EVENTS.READ, {
        conversation_id: current.conversation.id,
        last_message_id: targetMessage.id,
      });
      if (response?.EC !== 0) {
        if (response?.code === 'SOCKET_NOT_JOINED' && allowRejoin && await joinActiveSocket()) {
          lastReadRequestedRef.current = null;
          readInFlightRef.current = false;
          return markReadIfAppropriate({ allowRejoin: false });
        }
        throw response;
      }
      dispatch({
        type: 'READ_SUCCESS',
        lastReadMessageId: response.DT.last_read_message_id,
        readAt: response.DT.read_at,
      });
      return true;
    } catch (error) {
      lastReadRequestedRef.current = null;
      if (!applyAccessError(error)) {
        const envelope = getErrorEnvelope(error);
        if (!['ACK_TIMEOUT', 'SOCKET_DISCONNECTED'].includes(envelope.code)) {
          dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(envelope) });
        }
      }
      return false;
    } finally {
      readInFlightRef.current = false;
    }
  }, [applyAccessError, joinActiveSocket]);

  const transmitMessage = useCallback(async (message, { allowRejoin = true } = {}) => {
    const socket = socketRef.current;
    const current = stateRef.current;

    if (!socket?.connected) {
      dispatch({
        type: 'MESSAGE_FAILED',
        clientMessageId: message.client_message_id,
        message: getFriendlyChatError({ code: 'SOCKET_DISCONNECTED' }),
        code: 'SOCKET_DISCONNECTED',
        retryable: true,
      });
      return false;
    }

    if (!current.joined) {
      if (!allowRejoin || !(await joinActiveSocket())) {
        dispatch({
          type: 'MESSAGE_FAILED',
          clientMessageId: message.client_message_id,
          message: 'Could not join the conversation. Please retry.',
          code: 'SOCKET_NOT_JOINED',
          retryable: true,
        });
        return false;
      }
    }

    try {
      const response = await emitWithAcknowledgement(socketRef.current, CHAT_EVENTS.SEND_MESSAGE, {
        conversation_id: current.conversation.id,
        client_message_id: message.client_message_id,
        content: message.content,
      });

      if (response?.EC !== 0) {
        if (response?.code === 'SOCKET_NOT_JOINED' && allowRejoin && await joinActiveSocket()) {
          return transmitMessage(message, { allowRejoin: false });
        }
        throw response;
      }

      dispatch({ type: 'MESSAGE_CONFIRMED', message: response.DT.message });
      return true;
    } catch (error) {
      const envelope = getErrorEnvelope(error);
      if (applyAccessError(envelope)) return false;

      if (envelope.code === 'RATE_LIMITED') {
        const retryAfterMs = Math.max(250, Number(envelope.DT?.retry_after_ms || 1000));
        dispatch({ type: 'RATE_LIMITED', cooldownUntil: Date.now() + retryAfterMs });
      }

      dispatch({
        type: 'MESSAGE_FAILED',
        clientMessageId: message.client_message_id,
        message: getFriendlyChatError(envelope),
        code: envelope.code,
        retryable: envelope.code !== 'CLIENT_MESSAGE_ID_CONFLICT',
      });
      return false;
    }
  }, [applyAccessError, joinActiveSocket]);

  const sendMessage = useCallback(async (rawContent) => {
    const normalized = normalizeMessageContent(rawContent);
    if (normalized.error) {
      dispatch({ type: 'COMPOSER_ERROR', message: normalized.error });
      return false;
    }

    const current = stateRef.current;
    if (!current.conversation?.id || current.accessState !== CHAT_ACCESS_STATES.ACTIVE) {
      dispatch({ type: 'COMPOSER_ERROR', message: 'Chat is not ready yet.' });
      return false;
    }

    const message = {
      id: null,
      conversation_id: current.conversation.id,
      sender_id: currentUserId,
      client_message_id: createClientMessageId(),
      message_type: 'TEXT',
      content: normalized.content,
      sent_at: null,
      local_sent_at: new Date().toISOString(),
      is_seen: false,
      seen_at: null,
      delivery_status: MESSAGE_DELIVERY_STATES.SENDING,
      delivery_error: null,
      retryable: true,
    };

    dispatch({ type: 'MESSAGE_OPTIMISTIC', message });
    return transmitMessage(message);
  }, [currentUserId, transmitMessage]);

  const retryMessage = useCallback(async (clientMessageId) => {
    const message = stateRef.current.messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    if (!message || message.retryable === false) return false;

    if (stateRef.current.cooldownUntil > Date.now()) {
      dispatch({ type: 'COMPOSER_ERROR', message: 'Please wait for the rate limit cooldown.' });
      return false;
    }

    dispatch({ type: 'MESSAGE_RETRYING', clientMessageId });
    return transmitMessage(message);
  }, [transmitMessage]);

  const resendMessageAsNew = useCallback(async (clientMessageId) => {
    const message = stateRef.current.messages.find(
      (item) => item.client_message_id === clientMessageId,
    );
    if (!message) return false;

    dispatch({ type: 'MESSAGE_REMOVED', clientMessageId });
    return sendMessage(message.content);
  }, [sendMessage]);

  const setViewportAtBottom = useCallback((isAtBottom) => {
    atBottomRef.current = isAtBottom;
    if (isAtBottom) void markReadIfAppropriate();
  }, [markReadIfAppropriate]);

  useEffect(() => {
    void discoverConversation();

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void discoverConversation({ silent: true });
        void markReadIfAppropriate();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [discoverConversation, markReadIfAppropriate]);

  useEffect(() => {
    const conversationId = state.conversation?.id;
    if (!conversationId
      || !accessToken
      || state.accessState !== CHAT_ACCESS_STATES.ACTIVE) {
      return undefined;
    }

    let disposed = false;
    let socket = null;
    let socketHandle = null;
    let handlers = null;

    const startSocket = async () => {
      dispatch({
        type: 'CONNECTION_STATE',
        connectionState: CHAT_CONNECTION_STATES.CONNECTING,
      });
      socketHandle = await acquireChatSocket(accessToken);
      socket = socketHandle.socket;
      if (disposed) {
        socketHandle.release();
        return;
      }
      socketRef.current = socket;

      const handleConnect = async () => {
        if (disposed) return;
        dispatch({
          type: 'CONNECTION_STATE',
          connectionState: CHAT_CONNECTION_STATES.CONNECTED,
        });
        const joined = await joinActiveSocket();
        if (joined && stateRef.current.historyLoaded) {
          await fetchLatestHistory(conversationId, { reset: false });
        }
      };

      const handleDisconnect = () => {
        if (disposed) return;
        dispatch({
          type: 'CONNECTION_STATE',
          connectionState: CHAT_CONNECTION_STATES.DISCONNECTED,
        });
      };

      const handleReconnectAttempt = () => {
        if (disposed) return;
        dispatch({
          type: 'CONNECTION_STATE',
          connectionState: CHAT_CONNECTION_STATES.RECONNECTING,
        });
      };

      const handleConnectError = (error) => {
        if (disposed) return;
        const envelope = error?.data || error;
        if (!applyAccessError(envelope)) {
          dispatch({
            type: 'CONNECTION_STATE',
            connectionState: CHAT_CONNECTION_STATES.DISCONNECTED,
          });
          dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(envelope) });
        }
      };

      const handleNewMessage = (message) => {
        if (disposed || message.conversation_id !== conversationId) return;
        const incrementUnread = message.sender_id !== currentUserId
          && (!isOpenRef.current
            || document.visibilityState !== 'visible'
            || !atBottomRef.current);
        dispatch({ type: 'MESSAGE_RECEIVED', message, incrementUnread });
      };

      const handleReadUpdated = (payload) => {
        if (disposed || payload.conversation_id !== conversationId) return;
        if (payload.user_id === currentUserId) {
          dispatch({
            type: 'READ_SUCCESS',
            lastReadMessageId: payload.last_read_message_id,
            readAt: payload.read_at,
          });
          return;
        }
        dispatch({
          type: 'PARTNER_READ_UPDATED',
          currentUserId,
          lastReadMessageId: payload.last_read_message_id,
          readAt: payload.read_at,
        });
      };

      const handleClosed = (payload) => {
        if (disposed || payload.conversation_id !== conversationId) return;
        dispatch({
          type: 'ACCESS_CLOSED',
          details: {
            code: 'CONVERSATION_CLOSED',
            reason: payload.reason,
            closed_at: payload.closed_at,
            message: 'This conversation has been closed.',
          },
        });
        void fetchLatestHistory(conversationId, { reset: false });
      };

      const handleSocketError = (envelope) => {
        if (disposed || applyAccessError(envelope)) return;
        dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(envelope) });
      };

      handlers = {
        handleClosed,
        handleConnect,
        handleConnectError,
        handleDisconnect,
        handleNewMessage,
        handleReadUpdated,
        handleReconnectAttempt,
        handleSocketError,
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.io.on('reconnect_attempt', handleReconnectAttempt);
      socket.on(CHAT_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.on(CHAT_EVENTS.READ_UPDATED, handleReadUpdated);
      socket.on(CHAT_EVENTS.CLOSED, handleClosed);
      socket.on(CHAT_EVENTS.ERROR, handleSocketError);

      if (socket.connected) {
        await handleConnect();
      } else {
        socket.connect();
      }
    };

    void startSocket().catch((error) => {
      if (disposed) return;
      dispatch({
        type: 'CONNECTION_STATE',
        connectionState: CHAT_CONNECTION_STATES.DISCONNECTED,
      });
      dispatch({ type: 'GENERAL_ERROR', message: getFriendlyChatError(error) });
    });

    return () => {
      disposed = true;
      if (socket?.connected) {
        socket.emit(CHAT_EVENTS.LEAVE, { conversation_id: conversationId }, () => {});
      }
      if (socket && handlers) {
        socket.off('connect', handlers.handleConnect);
        socket.off('disconnect', handlers.handleDisconnect);
        socket.off('connect_error', handlers.handleConnectError);
        socket.io.off('reconnect_attempt', handlers.handleReconnectAttempt);
        socket.off(CHAT_EVENTS.NEW_MESSAGE, handlers.handleNewMessage);
        socket.off(CHAT_EVENTS.READ_UPDATED, handlers.handleReadUpdated);
        socket.off(CHAT_EVENTS.CLOSED, handlers.handleClosed);
        socket.off(CHAT_EVENTS.ERROR, handlers.handleSocketError);
      }
      socketHandle?.release();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [
    accessToken,
    applyAccessError,
    currentUserId,
    fetchLatestHistory,
    joinActiveSocket,
    state.accessState,
    state.conversation?.id,
  ]);

  useEffect(() => {
    if (!isOpen || !state.historyLoaded || !state.joined || !state.messages.length) return;
    const frame = requestAnimationFrame(() => {
      void markReadIfAppropriate();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, markReadIfAppropriate, state.historyLoaded, state.joined, state.messages]);

  useEffect(() => {
    if (!state.cooldownUntil) return undefined;
    const updateClock = () => {
      const now = Date.now();
      setClock(now);
      if (now >= stateRef.current.cooldownUntil) {
        dispatch({ type: 'CLEAR_COOLDOWN' });
      }
    };
    updateClock();
    const interval = window.setInterval(updateClock, 250);
    return () => window.clearInterval(interval);
  }, [state.cooldownUntil]);

  const cooldownRemainingMs = Math.max(0, state.cooldownUntil - clock);
  const canSend = state.accessState === CHAT_ACCESS_STATES.ACTIVE
    && state.connectionState === CHAT_CONNECTION_STATES.CONNECTED
    && state.joined
    && cooldownRemainingMs === 0;

  return {
    ...state,
    canSend,
    cooldownRemainingMs,
    clearComposerError: () => dispatch({ type: 'CLEAR_COMPOSER_ERROR' }),
    clearGeneralError: () => dispatch({ type: 'CLEAR_GENERAL_ERROR' }),
    discoverConversation,
    loadOlderMessages,
    markReadIfAppropriate,
    openConversation,
    resendMessageAsNew,
    retryMessage,
    sendMessage,
    setViewportAtBottom,
  };
};

export default useJobChat;
