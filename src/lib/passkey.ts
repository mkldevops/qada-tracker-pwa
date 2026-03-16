const CREDENTIAL_ID_KEY = 'passkey_credential_id';
const ENABLED_KEY = 'passkey_enabled';

export function isPasskeySupported(): boolean {
	return !!window.PublicKeyCredential;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let str = '';
	for (const byte of bytes) {
		str += String.fromCharCode(byte);
	}
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(str: string): ArrayBuffer {
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded);
	const buffer = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		buffer[i] = binary.charCodeAt(i);
	}
	return buffer.buffer;
}

export async function registerPasskey(): Promise<void> {
	const credential = (await navigator.credentials.create({
		publicKey: {
			challenge: crypto.getRandomValues(new Uint8Array(32)),
			rp: { id: window.location.hostname, name: 'Qada Tracker' },
			user: {
				id: crypto.getRandomValues(new Uint8Array(16)),
				name: 'local-user',
				displayName: 'Utilisateur',
			},
			pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
			authenticatorSelection: {
				authenticatorAttachment: 'platform',
				userVerification: 'required',
				residentKey: 'preferred',
			},
			timeout: 60000,
		},
	})) as PublicKeyCredential | null;

	if (!credential) throw new Error('Registration cancelled');

	localStorage.setItem(CREDENTIAL_ID_KEY, bufferToBase64url(credential.rawId));
	localStorage.setItem(ENABLED_KEY, 'true');
}

export async function authenticateWithPasskey(): Promise<boolean> {
	const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY);
	if (!credentialId) return false;

	const credential = await navigator.credentials.get({
		publicKey: {
			challenge: crypto.getRandomValues(new Uint8Array(32)),
			allowCredentials: [
				{
					id: base64urlToBuffer(credentialId),
					type: 'public-key',
				},
			],
			userVerification: 'required',
			timeout: 60000,
		},
	});

	return credential !== null;
}

export function isPasskeyEnabled(): boolean {
	return (
		localStorage.getItem(ENABLED_KEY) === 'true' && localStorage.getItem(CREDENTIAL_ID_KEY) !== null
	);
}

export function disablePasskey(): void {
	localStorage.removeItem(ENABLED_KEY);
	localStorage.removeItem(CREDENTIAL_ID_KEY);
}
