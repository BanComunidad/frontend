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

/** Punto de la serie de evolución de saldo (fecha ISO + saldo en CLP). */
export type BalancePoint = {
	date: string;
	balance: number;
};

/** Perfil del usuario de la sesión (GET /api/me). */
export type Profile = {
	id: string;
	rut: string;
	email: string;
	first_name: string;
	last_name: string;
	platform_role: string;
	mfa_enabled: boolean;
	pending_email?: string;
};

export type Attorney = {
	id: string;
	type: string;
	name: string;
	identification: string;
	status: string;
};

export type ContactCategoryKind = 'REMUNERACION' | 'PROVEEDOR' | 'GENERAL';

export type ContactCategory = {
	id: string;
	name: string;
	kind: ContactCategoryKind;
	status: string;
};

export type ContactAccountType = 'CTA_CORRIENTE' | 'CTA_VISTA' | 'CUENTA_RUT' | 'CTA_AHORRO';

export type ContactBankAccount = {
	id: string;
	bank_name: string;
	account_type: ContactAccountType;
	account_num: string;
	is_default: boolean;
};

/** Contacto de la libreta de la administradora (reutilizable entre sus comunidades). */
export type Contact = {
	id: string;
	category_id: string;
	category_name: string;
	rut: string;
	name: string;
	email?: string;
	phone?: string;
	role_note?: string;
	unit_label?: string;
	status: 'ACTIVE' | 'INACTIVE';
	accounts?: ContactBankAccount[];
};

export type TransferStatus = 'PENDING_SIGNATURES' | 'APPROVED' | 'CANCELLED';

export type TransferSignature = {
	user_id: string;
	name: string;
	signed_at: string;
};

/** Transferencia a un contacto, con su estado de aprobación por doble firma. */
export type Transfer = {
	id: string;
	contact_id: string;
	contact_name: string;
	contact_bank_account_id: string;
	bank_name: string;
	account_num: string;
	category_id: string;
	category_name: string;
	amount: number;
	status: TransferStatus;
	created_by: string;
	created_by_name: string;
	created_at: string;
	approved_at?: string;
	cancelled_at?: string;
	signatures: TransferSignature[];
};

/** Apoderado (usuario con rol ATTORNEY) con acceso a BanComunidad para firmar transferencias. */
export type Signer = {
	user_id: string;
	name: string;
	email: string;
	status: string;
};
