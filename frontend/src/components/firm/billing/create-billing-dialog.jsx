import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INVOICE_TYPES, invoiceTypeLabels } from './billing-variants';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, index) => ({ value: index + 1, label }));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function getEngagementClientId(engagement) {
  return (
    engagement?.client_id ??
    engagement?.client?.id ??
    engagement?.business?.id ??
    null
  );
}

export function CreateBillingDialog({
  open = false,
  onOpenChange,
  onSubmit,
  engagements = [],
  clients = [],
  billings = [],
  submitting = false,
  error,
  initialEngagementId = '',
}) {
  const now = new Date();
  const currentBillingMonth = now.getMonth() + 1;
  const currentBillingYear = now.getFullYear();
  const engagementSearchRef = useRef(null);
  const [engagementIds, setEngagementIds] = useState(
    initialEngagementId ? [initialEngagementId] : []
  );
  const [engagementSearch, setEngagementSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [billingMonth, setBillingMonth] = useState(String(currentBillingMonth));
  const [billingYear, setBillingYear] = useState(String(currentBillingYear));
  const [amount, setAmount] = useState('');
  const [engagementAmounts, setEngagementAmounts] = useState({});
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const isServiceFee = invoiceType === 'service_fee';
  const isRetainerFee = invoiceType === 'retainer_fee';
  const selectedClient = clients.find((client) => client.id === clientId);
  const selectedEngagements = engagements.filter((engagement) =>
    engagementIds.includes(engagement.id)
  );
  const engagementsUnavailable = engagements.length === 0;
  const serviceTotal = selectedEngagements.reduce(
    (total, engagement) =>
      total + (Number(engagementAmounts[engagement.id]) || 0),
    0
  );
  const selectedMonthLabel =
    MONTHS.find((month) => month.value === Number(billingMonth))?.label ?? '';
  const selectedBillingPeriod =
    billingMonth && billingYear ? `${selectedMonthLabel} ${billingYear}` : '';
  const filteredEngagements = useMemo(() => {
    const query = engagementSearch.trim().toLowerCase();
    if (!query) return [];
    return engagements.filter((engagement) => {
      if (
        isRetainerFee &&
        (!selectedClient ||
          getEngagementClientId(engagement) !== selectedClient.id)
      )
        return false;
      return [
        engagement.engagementNumber,
        engagement.serviceName,
        engagement.business?.businessName,
        engagement.client?.firstName,
        engagement.client?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [engagementSearch, engagements, isRetainerFee, selectedClient]);
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return [];
    return clients.filter((client) => {
      const isRetainerClient =
        client.clientType === 'retainer' || client.type === 'retainer';
      const searchableText = [
        client.firstName,
        client.lastName,
        client.email,
        client.businessName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return isRetainerClient && searchableText.includes(query);
    });
  }, [clientSearch, clients]);
  const duplicateServiceFee =
    isServiceFee &&
    engagementIds.some((id) =>
      billings.some(
        (billing) =>
          billing.invoice_type === 'service_fee' &&
          billing.status !== 'cancelled' &&
          (billing.engagement_ids?.includes(id) || billing.engagement_id === id)
      )
    );
  const duplicateRetainer =
    isRetainerFee &&
    billings.some(
      (billing) =>
        billing.invoice_type === 'retainer_fee' &&
        billing.status !== 'cancelled' &&
        engagementIds.some(
          (id) =>
            billing.engagement_ids?.includes(id) || billing.engagement_id === id
        ) &&
        billing.billing_month === Number(billingMonth) &&
        billing.billing_year === Number(billingYear)
    );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDueDate = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
  const dueDateInvalid =
    !selectedDueDate ||
    Number.isNaN(selectedDueDate.getTime()) ||
    selectedDueDate < today;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setEngagementIds(initialEngagementId ? [initialEngagementId] : []);
    setEngagementSearch('');
    setClientId('');
    setClientSearch('');
    setInvoiceType('');
    setBillingMonth(String(currentBillingMonth));
    setBillingYear(String(currentBillingYear));
    setAmount('');
    setEngagementAmounts({});
    setDueDate('');
    setErrors({});
  }, [open, initialEngagementId, currentBillingMonth, currentBillingYear]);

  // Prefill each selected engagement's amount with its service fee so the
  // billing officer only has to confirm or adjust it.
  useEffect(() => {
    if (!isServiceFee || engagementIds.length === 0) return;
    setEngagementAmounts((previous) => {
      let next = previous;
      for (const id of engagementIds) {
        if (previous[id] !== undefined) continue;
        const engagement = engagements.find((item) => item.id === id);
        const fee = engagement?.serviceFee ?? engagement?.fee;
        if (fee === null || fee === undefined || fee === '') continue;
        if (next === previous) next = { ...previous };
        next[id] = String(fee);
      }
      return next;
    });
  }, [isServiceFee, engagementIds, engagements]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const engagementLabel = (engagement) =>
    `${engagement.engagementNumber ?? engagement.id} — ${engagement.serviceName ?? 'Untitled service'}`;
  const handleInvoiceTypeChange = (value) => {
    // Keep the pre-selected engagement (Create Billing from an engagement row)
    // when choosing the first invoice type; clear dependent state only when
    // switching between types.
    const switchingTypes = Boolean(invoiceType);
    setInvoiceType(value);
    if (switchingTypes) {
      setEngagementIds([]);
      setEngagementSearch('');
      setClientId('');
      setClientSearch('');
      setEngagementAmounts({});
    }
    setBillingMonth(String(currentBillingMonth));
    setBillingYear(String(currentBillingYear));
    setErrors({});
  };
  const handleSelectClient = (client) => {
    setClientId(client.id);
    setClientSearch('');
    setEngagementIds([]);
    setEngagementSearch('');
    setErrors((previous) => ({
      ...previous,
      client: false,
      engagement: false,
    }));
  };
  const handleSelectEngagement = (engagement) => {
    if (engagementIds.includes(engagement.id)) return;
    const firstEngagement = selectedEngagements[0];
    if (
      firstEngagement &&
      (!getEngagementClientId(firstEngagement) ||
        !getEngagementClientId(engagement) ||
        getEngagementClientId(firstEngagement) !==
          getEngagementClientId(engagement))
    ) {
      setErrors((previous) => ({
        ...previous,
        engagement: 'Select engagements belonging to the same client.',
      }));
      return;
    }
    setEngagementIds((previous) => [...previous, engagement.id]);
    setEngagementSearch('');
    setErrors((previous) => ({ ...previous, engagement: false }));
  };
  const handleRemoveEngagement = (id) => {
    setEngagementIds((previous) =>
      previous.filter((engagementId) => engagementId !== id)
    );
    setEngagementAmounts((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setErrors((previous) => ({ ...previous, engagement: false }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedAmount = amount.trim();
    const numericAmount = Number(trimmedAmount);
    const lineAmounts = engagementIds.map((id) =>
      Number(engagementAmounts[id])
    );
    const lineAmountsValid =
      !isServiceFee ||
      (lineAmounts.length > 0 &&
        lineAmounts.every((value) => Number.isFinite(value) && value > 0));
    const newErrors = {
      invoiceType: !invoiceType,
      client: isRetainerFee && !clientId,
      engagement:
        (isServiceFee || isRetainerFee) &&
        (engagementIds.length === 0 ||
          duplicateServiceFee ||
          duplicateRetainer),
      billingPeriod:
        isRetainerFee && (!billingMonth || !billingYear || duplicateRetainer),
      amount: isServiceFee
        ? !lineAmountsValid
        : !trimmedAmount ||
          !AMOUNT_PATTERN.test(trimmedAmount) ||
          !Number.isFinite(numericAmount) ||
          numericAmount <= 0,
      dueDate: dueDateInvalid,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    onSubmit?.({
      engagement_id: engagementIds[0] ?? null,
      engagement_ids: engagementIds,
      client_id: isRetainerFee ? clientId : null,
      billing_month: isRetainerFee ? Number(billingMonth) : null,
      billing_year: isRetainerFee ? Number(billingYear) : null,
      invoice_type: invoiceType,
      amount: isServiceFee ? serviceTotal : numericAmount,
      engagement_amounts: isServiceFee
        ? Object.fromEntries(
            engagementIds.map((id) => [id, Number(engagementAmounts[id])])
          )
        : {},
      due_date: dueDate,
      payment_method: null,
      payment_reference: '',
      payment_proof_url: '',
    });
  };
  const updatePeriod = (key, value) => {
    if (key === 'month') setBillingMonth(String(value));
    if (key === 'year') setBillingYear(String(value));
    setErrors((previous) => ({ ...previous, billingPeriod: false }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Billing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>
                Billing Type <span className="text-red-500">*</span>
              </FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-between font-normal',
                      !invoiceType && 'text-muted-foreground'
                    )}
                  >
                    {invoiceType
                      ? invoiceTypeLabels[invoiceType]
                      : 'Select billing type'}
                    <span className="text-xs opacity-60">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {INVOICE_TYPES.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleInvoiceTypeChange(type)}
                    >
                      {invoiceTypeLabels[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.invoiceType && (
                <p className="text-xs text-red-500">
                  Please select an invoice type.
                </p>
              )}
            </Field>
            {isRetainerFee && (
              <Field>
                <FieldLabel>
                  Client <span className="text-red-500">*</span>
                </FieldLabel>
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {selectedClient.businessName ||
                        `${selectedClient.firstName ?? ''} ${selectedClient.lastName ?? ''}`.trim() ||
                        selectedClient.email ||
                        'Unnamed client'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setClientId('');
                        setClientSearch('');
                        setEngagementIds([]);
                        setEngagementSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={clientSearch}
                        onChange={(event) => {
                          setClientSearch(event.target.value);
                          setErrors((previous) => ({
                            ...previous,
                            client: false,
                          }));
                        }}
                        placeholder="Search client..."
                        className="pl-9"
                        disabled={clients.length === 0}
                      />
                    </div>
                    {clientSearch && filteredClients.length > 0 && (
                      <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-background">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => handleSelectClient(client)}
                          >
                            <span className="font-medium">
                              {client.businessName ||
                                `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
                                'Unnamed client'}
                            </span>
                            {client.email && (
                              <span className="text-xs text-muted-foreground">
                                {client.email}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {clientSearch && filteredClients.length === 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No matching clients found.
                      </p>
                    )}
                  </>
                )}
                {errors.client && (
                  <p className="text-xs text-red-500">
                    Please select a client.
                  </p>
                )}
              </Field>
            )}
            {(isServiceFee || isRetainerFee) && (
              <Field>
                <FieldLabel>
                  Engagements <span className="text-red-500">*</span>
                </FieldLabel>
                {selectedEngagements.map((engagement) => (
                  <div
                    key={engagement.id}
                    className="mt-2 flex items-center gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {engagementLabel(engagement)}
                      </p>
                      {engagement.business?.businessName && (
                        <p className="text-xs text-muted-foreground">
                          {engagement.business.businessName}
                        </p>
                      )}
                    </div>
                    {isServiceFee && (
                      <Input
                        className="w-28"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={engagementAmounts[engagement.id] ?? ''}
                        onChange={(event) =>
                          setEngagementAmounts((previous) => ({
                            ...previous,
                            [engagement.id]: event.target.value,
                          }))
                        }
                        aria-label={`Amount for ${engagementLabel(engagement)}`}
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleRemoveEngagement(engagement.id)}
                      aria-label={`Remove ${engagementLabel(engagement)}`}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={engagementSearchRef}
                    value={engagementSearch}
                    onChange={(event) => {
                      setEngagementSearch(event.target.value);
                      setErrors((previous) => ({
                        ...previous,
                        engagement: false,
                      }));
                    }}
                    placeholder={
                      isRetainerFee && !selectedClient
                        ? 'Select a client first'
                        : 'Search engagement...'
                    }
                    className="pl-9"
                    disabled={
                      engagementsUnavailable ||
                      (isRetainerFee && !selectedClient)
                    }
                  />
                </div>
                {engagementSearch && filteredEngagements.length > 0 && (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-background">
                    {filteredEngagements.map((engagement) => {
                      const alreadySelected = engagementIds.includes(
                        engagement.id
                      );
                      const firstClientId = getEngagementClientId(
                        selectedEngagements[0]
                      );
                      const candidateClientId =
                        getEngagementClientId(engagement);
                      const differentClient =
                        Boolean(selectedEngagements[0]) &&
                        (!firstClientId ||
                          !candidateClientId ||
                          firstClientId !== candidateClientId);
                      const alreadyBilled = billings.some(
                        (billing) =>
                          billing.invoice_type === invoiceType &&
                          billing.status !== 'cancelled' &&
                          (billing.engagement_ids?.includes(engagement.id) ||
                            billing.engagement_id === engagement.id) &&
                          (isServiceFee ||
                            (billing.billing_month === Number(billingMonth) &&
                              billing.billing_year === Number(billingYear)))
                      );
                      return (
                        <button
                          key={engagement.id}
                          type="button"
                          disabled={
                            alreadySelected || differentClient || alreadyBilled
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => handleSelectEngagement(engagement)}
                        >
                          <Plus className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">
                              {engagementLabel(engagement)}
                            </span>
                            {alreadySelected && (
                              <span className="block text-xs text-muted-foreground">
                                Already selected
                              </span>
                            )}
                            {differentClient && (
                              <span className="block text-xs text-muted-foreground">
                                Belongs to a different client
                              </span>
                            )}
                            {alreadyBilled && !alreadySelected && (
                              <span className="block text-xs text-muted-foreground">
                                Already billed
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {engagementSearch && filteredEngagements.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No matching engagements found.
                  </p>
                )}
                {selectedEngagements.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => engagementSearchRef.current?.focus()}
                  >
                    <Plus className="size-4" />
                    Add Engagement
                  </Button>
                )}
                {errors.engagement && (
                  <p className="text-xs text-red-500">
                    {typeof errors.engagement === 'string'
                      ? errors.engagement
                      : duplicateServiceFee || duplicateRetainer
                        ? 'One or more selected engagements already have this billing type for the selected period.'
                        : 'Please select at least one engagement.'}
                  </p>
                )}
                {engagementsUnavailable && (
                  <p className="text-xs text-muted-foreground">
                    No engagements are available.
                  </p>
                )}
              </Field>
            )}
            {isRetainerFee && (
              <Field>
                <FieldLabel>
                  Billing Period <span className="text-red-500">*</span>
                </FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        {selectedMonthLabel}
                        <span className="text-xs opacity-60">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 w-[220px] overflow-y-auto">
                      {MONTHS.map((month) => (
                        <DropdownMenuItem
                          key={month.value}
                          onClick={() => updatePeriod('month', month.value)}
                        >
                          {month.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        {billingYear}
                        <span className="text-xs opacity-60">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {YEARS.map((year) => (
                        <DropdownMenuItem
                          key={year}
                          onClick={() => updatePeriod('year', year)}
                        >
                          {year}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground">
                  Defaults to the current billing period. Change it if billing
                  for a different period.
                </p>
                {errors.billingPeriod && (
                  <p className="text-xs text-red-500">
                    {duplicateRetainer
                      ? `A retainer fee already exists for the selected engagements for ${selectedBillingPeriod}.`
                      : 'Please select a billing period.'}
                  </p>
                )}
              </Field>
            )}
            <Field>
              <FieldLabel>
                Amount <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                value={isServiceFee ? serviceTotal.toFixed(2) : amount}
                onChange={(event) => {
                  if (!isServiceFee) {
                    setAmount(event.target.value);
                    setErrors((previous) => ({ ...previous, amount: false }));
                  }
                }}
                placeholder="0.00"
                readOnly={isServiceFee}
              />
              {errors.amount && (
                <p className="text-xs text-red-500">
                  {isServiceFee
                    ? 'Enter a valid amount for every selected engagement.'
                    : 'Enter a valid amount greater than 0.'}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>
                Due Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(event) => {
                  setDueDate(event.target.value);
                  setErrors((previous) => ({ ...previous, dueDate: false }));
                }}
              />
              {errors.dueDate && (
                <p className="text-xs text-red-500">
                  Due date must be today or a future date.
                </p>
              )}
            </Field>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || engagementsUnavailable}
            >
              {submitting ? 'Creating...' : 'Create Billing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
