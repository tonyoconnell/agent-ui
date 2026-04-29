-- Add suiWallet plugin fields to user table
--
-- The suiWallet plugin declares wallet/frontDoor/legacyAddress/maxEpoch in its
-- plugin schema. Better Auth includes these in every user INSERT/SELECT, so the
-- columns must exist or auth operations fail with "no such column: user.wallet".

ALTER TABLE "user" ADD COLUMN wallet      TEXT;
ALTER TABLE "user" ADD COLUMN frontDoor   TEXT;
ALTER TABLE "user" ADD COLUMN legacyAddress INTEGER;
ALTER TABLE "user" ADD COLUMN maxEpoch    INTEGER;
