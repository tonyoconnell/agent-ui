declare module 'one-protocol' {
  export const AddressSchema: { parse: (v: unknown) => string }
  export const wallet_generate: { name: string; version: string; description: string }
  export const wallet_derive: { name: string; version: string; description: string }
}
