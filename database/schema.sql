-- ============================================================
-- CryptoPaperBot — Database Schema
-- PostgreSQL
-- ============================================================
-- PAPER TRADING ONLY. No real funds. No live orders.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TRADING PAIRS
-- ============================================================
CREATE TABLE trading_pairs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol        VARCHAR(20)  NOT NULL UNIQUE,  -- Internal: "BTC/USDT"
  source_symbol VARCHAR(20)  NOT NULL,          -- Exchange: "BTCUSDT"
  base_asset    VARCHAR(10)  NOT NULL,
  quote_asset   VARCHAR(10)  NOT NULL,
  exchange      VARCHAR(50)  NOT NULL,
  min_order_size DECIMAL(20,8) NOT NULL DEFAULT 0,
  tick_size      DECIMAL(20,8) NOT NULL DEFAULT 0.01,
  step_size      DECIMAL(20,8) NOT NULL DEFAULT 0.00001,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TICKER SNAPSHOTS
-- ============================================================
CREATE TABLE ticker_snapshots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol              VARCHAR(20)   NOT NULL,
  source_symbol       VARCHAR(20)   NOT NULL,
  exchange            VARCHAR(50)   NOT NULL,
  timestamp           TIMESTAMPTZ   NOT NULL,
  received_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  bid_price           DECIMAL(20,8) NOT NULL,
  ask_price           DECIMAL(20,8) NOT NULL,
  last_price          DECIMAL(20,8) NOT NULL,
  volume_24h          DECIMAL(24,8) NOT NULL,
  price_change_24h    DECIMAL(20,8) NOT NULL,
  price_change_pct_24h DECIMAL(10,4) NOT NULL,
  high_24h            DECIMAL(20,8) NOT NULL,
  low_24h             DECIMAL(20,8) NOT NULL
);

CREATE INDEX idx_ticker_snapshots_symbol_time ON ticker_snapshots(symbol, timestamp DESC);

-- ============================================================
-- CANDLES (OHLCV)
-- ============================================================
CREATE TABLE candles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol       VARCHAR(20)   NOT NULL,
  exchange     VARCHAR(50)   NOT NULL,
  open_time    TIMESTAMPTZ   NOT NULL,
  close_time   TIMESTAMPTZ   NOT NULL,
  interval     VARCHAR(5)    NOT NULL,  -- '1m','5m','15m','1h','4h','1d'
  open         DECIMAL(20,8) NOT NULL,
  high         DECIMAL(20,8) NOT NULL,
  low          DECIMAL(20,8) NOT NULL,
  close        DECIMAL(20,8) NOT NULL,
  volume       DECIMAL(24,8) NOT NULL,
  quote_volume DECIMAL(24,8) NOT NULL,
  trade_count  INTEGER       NOT NULL DEFAULT 0,
  is_closed    BOOLEAN       NOT NULL DEFAULT FALSE,
  received_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, exchange, interval, open_time)
);

CREATE INDEX idx_candles_symbol_interval_time ON candles(symbol, interval, open_time DESC);

-- ============================================================
-- ORDER BOOK SNAPSHOTS
-- ============================================================
CREATE TABLE order_book_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol      VARCHAR(20)  NOT NULL,
  exchange    VARCHAR(50)  NOT NULL,
  timestamp   TIMESTAMPTZ  NOT NULL,
  received_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  bids        JSONB        NOT NULL DEFAULT '[]',  -- [{price, quantity}]
  asks        JSONB        NOT NULL DEFAULT '[]',
  depth       INTEGER      NOT NULL DEFAULT 20
);

CREATE INDEX idx_orderbook_symbol_time ON order_book_snapshots(symbol, timestamp DESC);

-- ============================================================
-- MARKET TRADES (TAPE)
-- ============================================================
CREATE TABLE market_trades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol      VARCHAR(20)   NOT NULL,
  exchange    VARCHAR(50)   NOT NULL,
  timestamp   TIMESTAMPTZ   NOT NULL,
  received_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  price       DECIMAL(20,8) NOT NULL,
  quantity    DECIMAL(20,8) NOT NULL,
  side        VARCHAR(4)    NOT NULL CHECK(side IN ('buy','sell')),
  trade_id    VARCHAR(50)   NOT NULL
);

CREATE INDEX idx_market_trades_symbol_time ON market_trades(symbol, timestamp DESC);

-- ============================================================
-- STRATEGY SIGNALS
-- ============================================================
CREATE TABLE strategy_signals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id         VARCHAR(100)  NOT NULL,
  symbol              VARCHAR(20)   NOT NULL,
  timestamp           TIMESTAMPTZ   NOT NULL,
  action              VARCHAR(10)   NOT NULL CHECK(action IN ('buy','sell','hold','close')),
  confidence          DECIMAL(4,3)  NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  reason_code         VARCHAR(50)   NOT NULL,
  reason_detail       TEXT          NOT NULL,
  reference_price     DECIMAL(20,8) NOT NULL,
  indicator_snapshot  JSONB         NOT NULL DEFAULT '{}',
  ttl_ms              INTEGER       NOT NULL DEFAULT 5000,
  expires_at          TIMESTAMPTZ   NOT NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_symbol_time ON strategy_signals(symbol, timestamp DESC);

-- ============================================================
-- RISK DECISIONS
-- ============================================================
CREATE TABLE risk_decisions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id             UUID          NOT NULL REFERENCES strategy_signals(id),
  timestamp             TIMESTAMPTZ   NOT NULL,
  outcome               VARCHAR(10)   NOT NULL CHECK(outcome IN ('approved','vetoed')),
  veto_reason           VARCHAR(50),
  veto_detail           TEXT,
  checks_performed      JSONB         NOT NULL DEFAULT '[]',
  position_size_allowed DECIMAL(20,8),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_decisions_signal ON risk_decisions(signal_id);
CREATE INDEX idx_risk_decisions_outcome ON risk_decisions(outcome, timestamp DESC);

-- ============================================================
-- PAPER ORDERS
-- ============================================================
CREATE TABLE paper_orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id           UUID          NOT NULL REFERENCES strategy_signals(id),
  risk_decision_id    UUID          NOT NULL REFERENCES risk_decisions(id),
  symbol              VARCHAR(20)   NOT NULL,
  side                VARCHAR(4)    NOT NULL CHECK(side IN ('buy','sell')),
  type                VARCHAR(10)   NOT NULL CHECK(type IN ('market','limit')),
  status              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  requested_quantity  DECIMAL(20,8) NOT NULL,
  requested_price     DECIMAL(20,8),
  filled_quantity     DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_fill_price  DECIMAL(20,8) NOT NULL DEFAULT 0,
  assumed_fee_rate    DECIMAL(10,6) NOT NULL,
  assumed_slippage_bps INTEGER      NOT NULL,
  reason_code         VARCHAR(50)   NOT NULL,
  notes               TEXT          NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  filled_at           TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       TEXT
);

CREATE INDEX idx_paper_orders_symbol ON paper_orders(symbol, created_at DESC);
CREATE INDEX idx_paper_orders_status ON paper_orders(status);

-- ============================================================
-- SIMULATED FILLS
-- ============================================================
CREATE TABLE simulated_fills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID          NOT NULL REFERENCES paper_orders(id),
  symbol            VARCHAR(20)   NOT NULL,
  side              VARCHAR(4)    NOT NULL CHECK(side IN ('buy','sell')),
  quantity          DECIMAL(20,8) NOT NULL,
  fill_price        DECIMAL(20,8) NOT NULL,
  mid_price_at_fill DECIMAL(20,8) NOT NULL,
  slippage_applied  DECIMAL(20,8) NOT NULL,
  fee_applied       DECIMAL(20,8) NOT NULL,
  fee_rate          DECIMAL(10,6) NOT NULL,
  total_cost        DECIMAL(20,8) NOT NULL,
  filled_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fills_order ON simulated_fills(order_id);

-- ============================================================
-- OPEN POSITIONS
-- ============================================================
CREATE TABLE positions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol            VARCHAR(20)   NOT NULL,
  side              VARCHAR(5)    NOT NULL CHECK(side IN ('long','short')),
  entry_order_id    UUID          NOT NULL REFERENCES paper_orders(id),
  status            VARCHAR(10)   NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  quantity          DECIMAL(20,8) NOT NULL,
  entry_price       DECIMAL(20,8) NOT NULL,
  current_price     DECIMAL(20,8) NOT NULL DEFAULT 0,
  unrealized_pnl    DECIMAL(20,8) NOT NULL DEFAULT 0,
  unrealized_pnl_pct DECIMAL(10,4) NOT NULL DEFAULT 0,
  total_fees_paid   DECIMAL(20,8) NOT NULL DEFAULT 0,
  opened_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ,
  exit_price        DECIMAL(20,8),
  realized_pnl      DECIMAL(20,8),
  closed_by_signal_id UUID        REFERENCES strategy_signals(id),
  closed_by_reason  TEXT
);

CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_symbol ON positions(symbol, opened_at DESC);

-- ============================================================
-- TRADE JOURNAL
-- ============================================================
CREATE TABLE trade_journal (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id               UUID          NOT NULL REFERENCES positions(id),
  entry_order_id            UUID          NOT NULL REFERENCES paper_orders(id),
  exit_order_id             UUID          REFERENCES paper_orders(id),
  symbol                    VARCHAR(20)   NOT NULL,
  side                      VARCHAR(5)    NOT NULL CHECK(side IN ('long','short')),

  -- Signal traceability
  entry_signal_id           UUID          NOT NULL REFERENCES strategy_signals(id),
  entry_signal_reason_code  VARCHAR(50)   NOT NULL,
  entry_signal_reason_detail TEXT         NOT NULL,
  exit_signal_id            UUID          REFERENCES strategy_signals(id),
  exit_signal_reason_code   VARCHAR(50),
  exit_signal_reason_detail TEXT,

  -- Prices
  entry_price               DECIMAL(20,8) NOT NULL,
  exit_price                DECIMAL(20,8),
  take_profit_trigger_pct   DECIMAL(6,2)  NOT NULL,
  stop_loss_trigger_pct     DECIMAL(6,2)  NOT NULL DEFAULT 0,

  -- Quantities and costs
  quantity                  DECIMAL(20,8) NOT NULL,
  entry_fee_usdt            DECIMAL(20,8) NOT NULL DEFAULT 0,
  exit_fee_usdt             DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_fees_usdt           DECIMAL(20,8) NOT NULL DEFAULT 0,

  -- Slippage
  assumed_slippage_bps      INTEGER       NOT NULL,
  estimated_slippage_cost   DECIMAL(20,8) NOT NULL DEFAULT 0,

  -- PnL
  gross_pnl_usdt            DECIMAL(20,8),
  net_pnl_usdt              DECIMAL(20,8),
  net_pnl_pct               DECIMAL(10,4),

  -- Timing
  opened_at                 TIMESTAMPTZ   NOT NULL,
  closed_at                 TIMESTAMPTZ,
  duration_ms               BIGINT,

  -- Outcome
  outcome                   VARCHAR(10)   CHECK(outcome IN ('win','loss','breakeven','open')),

  -- Audit
  notes                     TEXT          NOT NULL DEFAULT '',
  tags                      TEXT[]        NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_symbol ON trade_journal(symbol, opened_at DESC);
CREATE INDEX idx_journal_outcome ON trade_journal(outcome);

-- ============================================================
-- PORTFOLIO BALANCE SNAPSHOTS
-- ============================================================
CREATE TABLE portfolio_balance_snapshots (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  total_equity_usdt       DECIMAL(20,8) NOT NULL,
  available_usdt          DECIMAL(20,8) NOT NULL,
  locked_in_positions     DECIMAL(20,8) NOT NULL DEFAULT 0,
  unrealized_pnl          DECIMAL(20,8) NOT NULL DEFAULT 0,
  realized_pnl_session    DECIMAL(20,8) NOT NULL DEFAULT 0,
  realized_pnl_all_time   DECIMAL(20,8) NOT NULL DEFAULT 0,
  initial_balance         DECIMAL(20,8) NOT NULL,
  return_pct              DECIMAL(10,4) NOT NULL DEFAULT 0,
  assets                  JSONB         NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_portfolio_snapshots_time ON portfolio_balance_snapshots(snapshot_at DESC);

-- ============================================================
-- PERFORMANCE METRIC SNAPSHOTS
-- ============================================================
CREATE TABLE performance_snapshots (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  period_start              TIMESTAMPTZ   NOT NULL,
  period_end                TIMESTAMPTZ   NOT NULL,
  symbol                    VARCHAR(20),  -- NULL = all pairs

  total_trades              INTEGER       NOT NULL DEFAULT 0,
  winning_trades            INTEGER       NOT NULL DEFAULT 0,
  losing_trades             INTEGER       NOT NULL DEFAULT 0,
  open_trades               INTEGER       NOT NULL DEFAULT 0,

  win_rate                  DECIMAL(6,4)  NOT NULL DEFAULT 0,
  average_return_pct        DECIMAL(10,4) NOT NULL DEFAULT 0,
  average_win_pct           DECIMAL(10,4) NOT NULL DEFAULT 0,
  average_loss_pct          DECIMAL(10,4) NOT NULL DEFAULT 0,
  profit_factor             DECIMAL(10,4) NOT NULL DEFAULT 0,

  max_drawdown_pct          DECIMAL(10,4) NOT NULL DEFAULT 0,
  max_drawdown_usdt         DECIMAL(20,8) NOT NULL DEFAULT 0,
  sharpe_ratio              DECIMAL(10,4),

  average_trade_duration_ms BIGINT        NOT NULL DEFAULT 0,
  take_profit_hit_rate      DECIMAL(6,4)  NOT NULL DEFAULT 0,

  total_net_pnl_usdt        DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_fees_usdt           DECIMAL(20,8) NOT NULL DEFAULT 0,

  start_equity_usdt         DECIMAL(20,8) NOT NULL,
  end_equity_usdt           DECIMAL(20,8) NOT NULL,
  peak_equity_usdt          DECIMAL(20,8) NOT NULL
);

CREATE INDEX idx_performance_snapshots_time ON performance_snapshots(snapshot_at DESC);

-- ============================================================
-- SYSTEM HEALTH EVENTS
-- ============================================================
CREATE TABLE system_health_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  component   VARCHAR(30)  NOT NULL,
  severity    VARCHAR(10)  NOT NULL CHECK(severity IN ('info','warning','error','critical')),
  event_type  VARCHAR(50)  NOT NULL,
  detail      TEXT         NOT NULL,
  metadata    JSONB        NOT NULL DEFAULT '{}',
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_health_events_component ON system_health_events(component, timestamp DESC);
CREATE INDEX idx_health_events_severity ON system_health_events(severity, timestamp DESC);

-- ============================================================
-- SEED: Default trading pair
-- ============================================================
INSERT INTO trading_pairs (symbol, source_symbol, base_asset, quote_asset, exchange, min_order_size, tick_size, step_size)
VALUES ('BTC/USDT', 'BTCUSDT', 'BTC', 'USDT', 'binance-public', 0.00001, 0.01, 0.00001)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO trading_pairs (symbol, source_symbol, base_asset, quote_asset, exchange, min_order_size, tick_size, step_size)
VALUES ('ETH/USDT', 'ETHUSDT', 'ETH', 'USDT', 'binance-public', 0.0001, 0.01, 0.0001)
ON CONFLICT (symbol) DO NOTHING;
