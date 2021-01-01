
/* #userid", "text", "response", "action", "intent", "conversationId",
#"res", "delta" */

CREATE INDEX idx_words_trgm_gin_lowercaseword
   ON words USING gin(lowercaseword gin_trgm_ops);




CREATE TABLE words
(
  id serial NOT NULL,
  lowercaseword character varying(64) NOT NULL,
  matchedstring character varying(64) NOT NULL,
  category character varying(32) NOT NULL,
  i_wordid integer,
  i_category integer,
  CONSTRAINT words_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE words
  OWNER TO postgres;
GRANT ALL ON TABLE words TO postgres;
GRANT ALL ON TABLE words TO joe;
GRANT SELECT, USAGE ON SEQUENCE words_id_seq TO joe;
