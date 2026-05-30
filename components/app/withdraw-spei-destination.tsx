'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Trash2, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type SpeiWithdrawContact,
  addSpeiWithdrawContact,
  contactClabeMatchesAbbrHint,
  isValidMexicanClabe,
  loadSpeiWithdrawContacts,
  normalizeClabeDigits,
  removeSpeiWithdrawContact,
} from '@/lib/seyf/spei-withdraw-contacts'
import { cn } from '@/lib/utils'

const VERIFIED_VALUE = '__seyf_verified__'

export type WithdrawDestinationSelection =
  | { mode: 'verified' }
  | { mode: 'contact'; contact: SpeiWithdrawContact }

type Props = {
  abbrClabeHint: string | null
  bankAccountLabel: string | null
  disabled?: boolean
  onSelectionChange: (s: WithdrawDestinationSelection) => void
  onValidityChange: (ok: boolean, reason: string | null) => void
}

export function WithdrawSpeiDestination({
  abbrClabeHint,
  bankAccountLabel,
  disabled,
  onSelectionChange,
  onValidityChange,
}: Props) {
  const t = useTranslations('components.withdrawSpei')
  const [contacts, setContacts] = useState<SpeiWithdrawContact[]>([])
  const [selectValue, setSelectValue] = useState<string>(VERIFIED_VALUE)
  const [manageOpen, setManageOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newBeneficiary, setNewBeneficiary] = useState('')
  const [newClabe, setNewClabe] = useState('')
  const [formErr, setFormErr] = useState<string | null>(null)

  const refreshContacts = useCallback(() => {
    setContacts(loadSpeiWithdrawContacts())
  }, [])

  useEffect(() => {
    refreshContacts()
  }, [refreshContacts])

  useEffect(() => {
    if (selectValue === VERIFIED_VALUE) return
    if (!contacts.some((c) => c.id === selectValue)) {
      setSelectValue(VERIFIED_VALUE)
    }
  }, [contacts, selectValue])

  const selectedContact = useMemo(() => {
    if (selectValue === VERIFIED_VALUE) return null
    return contacts.find((c) => c.id === selectValue) ?? null
  }, [contacts, selectValue])

  useEffect(() => {
    if (selectValue === VERIFIED_VALUE) {
      onSelectionChange({ mode: 'verified' })
      onValidityChange(true, null)
      return
    }
    const c = contacts.find((x) => x.id === selectValue)
    if (!c) {
      onValidityChange(false, t('errors.invalidContact'))
      return
    }
    onSelectionChange({ mode: 'contact', contact: c })
    const match = contactClabeMatchesAbbrHint(c.clabe, abbrClabeHint)
    if (!match) {
      onValidityChange(false, t('errors.clabeNoMatch'))
      return
    }
    onValidityChange(true, null)
  }, [
    abbrClabeHint,
    contacts,
    onSelectionChange,
    onValidityChange,
    selectValue,
    t,
  ])

  const onAddContact = () => {
    setFormErr(null)
    const created = addSpeiWithdrawContact({
      label: newLabel,
      beneficiaryName: newBeneficiary,
      clabeDigits: newClabe,
    })
    if (!created) {
      setFormErr(t('errors.invalidForm'))
      return
    }
    refreshContacts()
    setSelectValue(created.id)
    setNewLabel('')
    setNewBeneficiary('')
    setNewClabe('')
    setManageOpen(false)
  }

  const maskClabe = (digits: string) => {
    if (digits.length < 8) return digits
    return `${digits.slice(0, 4)}…${digits.slice(-4)}`
  }

  return (
    <section
      className="space-y-4 rounded-[1.5rem] border border-[#bfd6ca] bg-[#f4faf7] p-5 dark:border-border dark:bg-card/80"
      aria-label={t('ariaSection')}
    >
      <div>
        <h2 className="text-base font-bold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t('body')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdraw-dest-select" className="text-xs font-semibold">
          {t('sendLabel')}
        </Label>
        <Select
          value={selectValue}
          onValueChange={setSelectValue}
          disabled={disabled}
        >
          <SelectTrigger
            id="withdraw-dest-select"
            className="h-12 rounded-2xl border-[#c6dccf] bg-background"
          >
            <SelectValue placeholder={t('selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VERIFIED_VALUE}>
              {t('verifiedAccount')}
              {bankAccountLabel ? ` — ${bankAccountLabel}` : ''}
            </SelectItem>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
                {c.beneficiaryName ? ` · ${c.beneficiaryName}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectValue === VERIFIED_VALUE ? (
        <div className="rounded-xl border border-border bg-background/70 px-3 py-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">
            {t('registeredAccount')}
          </p>
          {abbrClabeHint ? (
            <p className="mt-1 font-mono text-sm font-medium text-foreground">{abbrClabeHint}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('noClabeHint')}
            </p>
          )}
        </div>
      ) : selectedContact ? (
        <div className="rounded-xl border border-border bg-background/70 px-3 py-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">{t('selectedContact')}</p>
          <p className="mt-1 font-medium text-foreground">{selectedContact.label}</p>
          {selectedContact.beneficiaryName ? (
            <p className="text-xs text-muted-foreground">{selectedContact.beneficiaryName}</p>
          ) : null}
          <p className="mt-2 font-mono text-sm tabular-nums">
            {maskClabe(selectedContact.clabe)}
          </p>
          {!contactClabeMatchesAbbrHint(selectedContact.clabe, abbrClabeHint) ? (
            <p className="mt-2 text-xs font-medium text-destructive">
              {t('clabeNoMatch')}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#2d6a4f] dark:text-[#95d5b2]">
              {t('clabeMatch')}
            </p>
          )}
        </div>
      ) : null}

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setManageOpen((v) => !v)}
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-background/50"
        >
          <span className="inline-flex items-center gap-2">
            <UserPlus className="size-4 opacity-80" aria-hidden />
            {t('manageContacts')}
          </span>
          <ChevronDown
            className={cn('size-4 transition-transform', manageOpen && 'rotate-180')}
            aria-hidden
          />
        </button>

        {manageOpen ? (
          <div className="mt-3 space-y-4">
            {contacts.length ? (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.label}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {maskClabe(c.clabe)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        removeSpeiWithdrawContact(c.id)
                        refreshContacts()
                        if (selectValue === c.id) setSelectValue(VERIFIED_VALUE)
                      }}
                      aria-label={t('ariaDelete', { label: c.label })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t('noContacts')}</p>
            )}

            <div className="rounded-xl border border-dashed border-border bg-background/40 p-3 space-y-3">
              <p className="text-xs font-bold text-foreground">{t('registerContact')}</p>
              <Input
                placeholder={t('aliasPlaceholder')}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="rounded-xl"
                disabled={disabled}
              />
              <Input
                placeholder={t('beneficiaryPlaceholder')}
                value={newBeneficiary}
                onChange={(e) => setNewBeneficiary(e.target.value)}
                className="rounded-xl"
                disabled={disabled}
              />
              <Input
                inputMode="numeric"
                placeholder={t('clabePlaceholder')}
                value={newClabe}
                onChange={(e) => setNewClabe(normalizeClabeDigits(e.target.value))}
                maxLength={18}
                className="rounded-xl font-mono tabular-nums"
                disabled={disabled}
              />
              {formErr ? (
                <p className="text-xs text-destructive">{formErr}</p>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-2xl"
                disabled={
                  disabled ||
                  !newLabel.trim() ||
                  !isValidMexicanClabe(normalizeClabeDigits(newClabe))
                }
                onClick={() => onAddContact()}
              >
                {t('saveContact')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
