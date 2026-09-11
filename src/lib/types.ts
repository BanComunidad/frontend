// Tipos que reflejan los contratos del backend (ver Koin/backend/scripts/api/endpoints.md).

export type SessionInfo = {
	token: string;
	userId: string;
	communityId: string;
	role: string;
	platformRole: string;
};

export type CommunityRole = 'ADMINISTRATOR' | 'ATTORNEY' | 'VIEWER';

export type Membership = {
	community_id: string;
	legal_name: string;
	rut: string;
	role: CommunityRole;
};

export type Account = {
	id: string;
	provider_account_id: string;
	type: 'CURRENT' | 'SAVING';
	status: string;
	currency: string;
};

export type Balance = {
	available_balance: number;
	ledger_balance: number;
	currency: string;
	captured_at: string;
};

export type Movement = {
	id: string;
	provider_transaction_ref: string;
	date: string;
	amount: number;
	type: 'CREDIT' | 'DEBIT';
	description: string;
	resulting_balance?: number;
};

export type StatementSummary = {
	opening_balance: number;
	closing_balance: number;
	total_credits: number;
	total_debits: number;
	movement_count: number;
};

export type Statement = {
	id: string;
	provider_statement_id: string;
	period: string;
	status: string;
	summary: StatementSummary;
};

export type Attorney = {
	id: string;
	type: string;
	name: string;
	identification: string;
	status: string;
};
