-- ============ TABELAS PRINCIPAIS ============

-- Tabela de grupos WhatsApp monitorados
CREATE TABLE whatsapp_groups (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  group_phone TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

-- Tabela de mensagens brutes (tudo que é capturado)
CREATE TABLE raw_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_timestamp TIMESTAMP NOT NULL,
  captured_at TIMESTAMP DEFAULT NOW(),
  media_urls TEXT[] DEFAULT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(id)
);

-- Tabela de tópicos sumarizados
CREATE TABLE summarized_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL,
  date_discussed DATE NOT NULL,
  topic_title TEXT NOT NULL,
  discussion_summary TEXT NOT NULL,
  references_mentioned TEXT[] DEFAULT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_ai_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP DEFAULT NULL,
  approved_by_user_id UUID DEFAULT NULL,

  -- Metadados
  message_count INT,
  raw_message_ids UUID[],

  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(id),
  FOREIGN KEY (approved_by_user_id) REFERENCES auth.users(id)
);

-- Tabela de resumo diário (para performance)
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL,
  summary_date DATE NOT NULL,
  total_messages INT,
  total_topics INT,
  approved_topics INT,
  rejected_topics INT,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(id),
  UNIQUE(group_id, summary_date)
);

-- ============ ÍNDICES PARA PERFORMANCE ============

CREATE INDEX idx_raw_messages_group_date
  ON raw_messages(group_id, DATE(message_timestamp));

CREATE INDEX idx_raw_messages_is_processed
  ON raw_messages(is_processed);

CREATE INDEX idx_summarized_topics_group_status
  ON summarized_topics(group_id, status, date_discussed DESC);

CREATE INDEX idx_summarized_topics_status
  ON summarized_topics(status);

CREATE INDEX idx_daily_summaries_group_date
  ON daily_summaries(group_id, summary_date DESC);

-- ============ ROW LEVEL SECURITY ============

-- Habilitar RLS
ALTER TABLE raw_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE summarized_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Políticas para raw_messages (apenas leitura para usuários autenticados)
CREATE POLICY "Users can view raw messages"
  ON raw_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Políticas para summarized_topics (leitura para autenticados, update apenas admins)
CREATE POLICY "Users can view summarized topics"
  ON summarized_topics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update topics"
  ON summarized_topics FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Políticas para daily_summaries
CREATE POLICY "Users can view daily summaries"
  ON daily_summaries FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============ SAMPLE DATA ============

-- Inserir um grupo de teste (opcional)
INSERT INTO whatsapp_groups (id, group_name, group_phone)
VALUES ('559999999999-1234567890@g.us', 'Grupo Teste', '559999999999')
ON CONFLICT (id) DO NOTHING;

-- ============ VIEWS (opcional, para facilitar queries) ============

-- View de tópicos com contagem de aprovações
CREATE OR REPLACE VIEW topics_stats AS
SELECT
  group_id,
  DATE(date_discussed) as date,
  COUNT(*) as total_topics,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM summarized_topics
GROUP BY group_id, DATE(date_discussed);

-- View de mensagens por dia
CREATE OR REPLACE VIEW messages_per_day AS
SELECT
  group_id,
  DATE(message_timestamp) as date,
  COUNT(*) as total_messages,
  COUNT(DISTINCT sender_phone) as unique_senders
FROM raw_messages
GROUP BY group_id, DATE(message_timestamp);
