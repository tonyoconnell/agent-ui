// Synthetic test fixture: MUI component that needs TRANSLATE to shadcn
import React, { useState } from 'react'
import { Box, Typography, Chip, Button, Stack } from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'
import axios from 'axios'

interface AgentBadgeProps {
  agentId: string
  status: 'active' | 'idle' | 'error'
  strength: number
}

export function AgentBadge({ agentId, status, strength }: AgentBadgeProps) {
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    setLoading(true)
    await axios.post('/api/signal', { receiver: agentId, data: { action: 'activate' } })
    setLoading(false)
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {status === 'active' ? <CheckCircle color="success" /> : <Cancel color="error" />}
        <Typography variant="body2" fontWeight="bold">{agentId}</Typography>
        <Chip label={`strength: ${strength}`} size="small" variant="outlined" />
      </Stack>
      <Button
        variant="contained"
        size="small"
        disabled={loading}
        onClick={handleActivate}
        sx={{ mt: 1 }}
      >
        {loading ? 'Activating...' : 'Activate'}
      </Button>
    </Box>
  )
}
