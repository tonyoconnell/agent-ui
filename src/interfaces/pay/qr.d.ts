// Props for the Qr.tsx component
export interface QrProps {
  uri: string            // payment URI (chain-specific format)
  size?: number          // px, default 256
  label?: string
}
