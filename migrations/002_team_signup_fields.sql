ALTER TABLE teams
    ADD COLUMN captain_discord_name TEXT,
    ADD COLUMN captain_agreement_accepted_at TIMESTAMPTZ,
    ADD COLUMN captain_agreement_version TEXT,
    ADD CONSTRAINT captain_agreement_metadata CHECK (
        (captain_agreement_accepted_at IS NULL) = (captain_agreement_version IS NULL)
    );
