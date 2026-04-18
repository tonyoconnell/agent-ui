import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  url: string
}

export function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => null)
    } else {
      await handleCopy()
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  )
}
