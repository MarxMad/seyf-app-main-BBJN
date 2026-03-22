'use client'

import { useCallback, useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  type SpeiTransferDetails,
  formatSpeiMxnAmount,
} from '@/lib/etherfuse/spei-transfer-details'
import { cn } from '@/lib/utils'

function CopyChip({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setDone(true)
      window.setTimeout(() => setDone(false), 1600)
    })
  }, [value])
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiar ${label}`}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-none border border-border/80 bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        done && 'border-emerald-500/40 text-emerald-600',
      )}
      aria-label={`Copiar ${label}`}
    >
      <Copy className="size-3.5" />
    </button>
  )
}

function Row({
  label,
  value,
  mono,
  copyValue,
}: {
  label: string
  value: string
  mono?: boolean
  copyValue?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-3 last:border-0">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span
          className={cn(
            'text-right text-sm text-foreground',
            mono && 'break-all font-mono text-[13px]',
          )}
        >
          {value}
        </span>
        {copyValue ? <CopyChip value={copyValue} label={label} /> : null}
      </div>
    </div>
  )
}

export function SpeiTransferReviewDialog({
  open,
  onOpenChange,
  details,
  onConfirm,
  confirmBusy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: SpeiTransferDetails | null
  onConfirm: () => void | Promise<void>
  confirmBusy: boolean
}) {
  const amountLabel = details ? formatSpeiMxnAmount(details.amountMxn) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,640px)] gap-0 overflow-y-auto rounded-none border-border p-0 sm:max-w-md"
        showCloseButton={!confirmBusy}
      >
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="text-base font-bold text-foreground">SPEI</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4">
          {details ? (
            <>
              <p className="text-xs text-muted-foreground">
                {details.assetCode}
              </p>
              <div className="mt-3 rounded-none border border-border bg-card p-3">
                <Row label="CLABE" value={details.clabe} mono copyValue={details.clabe} />
                <Row label="Nombre" value={details.beneficiaryName} />
                <Row label="Monto" value={amountLabel} copyValue={String(details.amountMxn)} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Confirmar simula el depósito (sandbox).</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-none"
            disabled={confirmBusy}
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-none"
            disabled={!details || confirmBusy}
            onClick={() => void onConfirm()}
          >
            {confirmBusy ? '…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
