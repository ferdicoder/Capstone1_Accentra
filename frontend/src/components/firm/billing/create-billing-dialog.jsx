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
import { getZodFieldErrors, scrollToFirstInvalidField } from '@/lib/form-validation';
import { billingSchema } from '@/schemas/billingSchema';

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

function isEngagementRetainerCovered(engagement) {
  return (
    Boolean(engagement?.isRetainerCovered) ||
    engagement?.coverageType === 'retainer_covered' ||
    engagement?.coverage_type === 'retainer_covered'
  );
}

// Voided bills no longer count as existing bills.
function isActiveBilling(billing) {
  return billing.status !== 'voided';
}

function getEngagementClientId(engagement) {
  return (
    engagement?.client_id ??
    engagement?.client?.id ??
    engagement?.business?.id ??
    null
  );
}

// A client can be identified by its own id or by its business id,
// depending on which list the record came from. Compare on any match.
function getClientKeys(client) {
  return [client?.id, client?.businessId, client?.business_id, client?.business?.id]
    .filter(Boolean)
    .map(String);
}

function getBillingClientKeys(billing, engagements) {
  const direct = [billing.business_id, billing.client_id, billing.business?.id]
    .filter(Boolean)
    .map(String);
  if (direct.length) return direct;

  const engagementIds =
    billing.engagement_ids ?? (billing.engagement_id ? [billing.engagement_id] : []);
  return engagementIds
    .map((id) =>
      getEngagementClientId(engagements.find((engagement) => engagement.id === id))
    )
    .filter(Boolean)
    .map(String);
}

function getBillingPeriod(billing) {
  const month = Number(billing.billing_month);
  const year = Number(billing.billing_year);
  if (
    billing.billing_month != null &&
    billing.billing_year != null &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year)
  ) {
    return { month, year };
  }

  const dueDate = billing.due_date;
  if (typeof dueDate !== 'string') return null;

  const dateParts = dueDate.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (!dateParts) return null;

  const dueYear = Number(dateParts[1]);
  const dueMonth = Number(dateParts[2]);
  return dueMonth >= 1 && dueMonth <= 12
    ? { month: dueMonth, year: dueYear }
    : null;
}

function isRetainerClient(client) {
  return client?.clientType === 'retainer' || client?.type === 'retainer';
}

// Retainer Fee can only be chosen for a retainer client. With no client
// selected yet it stays available (the client search then only lists
// retainer clients).
function isInvoiceTypeDisabled(type, client) {
  return type === 'retainer_fee' && Boolean(client) && !isRetainerClient(client);
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
  const formRef = useRef(null);
  const autoTypeRef = useRef(false);
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
  const initialEngagement = engagements.find(
    (engagement) => engagement.id === initialEngagementId
  );
  const initialClient = clients.find(
    (client) => client.id === getEngagementClientId(initialEngagement)
  );
  // Client is the first field of the form, so prefill it from the
  // pre-selected engagement (Create Billing from an engagement row).
  const initialClientId = initialClient?.id ?? '';
  const initialRetainerFee = initialClient?.retainerFee ?? null;
  const initialClientIsRetainer = isRetainerClient(initialClient);
  const initialEngagementRetainerCovered =
    isEngagementRetainerCovered(initialEngagement);
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
      // Retainer Fee bills only link retainer-covered engagements.
      if (isRetainerFee && !isEngagementRetainerCovered(engagement)) return false;
      // Retainer-covered engagements must never get a Service Fee bill.
      if (isServiceFee && isEngagementRetainerCovered(engagement)) return false;
      // Engagements are always scoped to the searched client.
      if (
        selectedClient &&
        getEngagementClientId(engagement) !== selectedClient.id
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
  }, [engagementSearch, engagements, selectedClient, isRetainerFee, isServiceFee]);
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return [];
    return clients.filter((client) => {
      // Billing rows are keyed by business_id — clients without a business
      // cannot be billed yet.
      if (client.hasBusiness === false) return false;
      // Retainer fee billings can only be raised against retainer clients.
      if (isRetainerFee && !isRetainerClient(client)) return false;
      const searchableText = [
        client.firstName,
        client.lastName,
        client.email,
        client.businessName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchableText.includes(query);
    });
  }, [clientSearch, clients, isRetainerFee]);
  const duplicateServiceFee =
    isServiceFee &&
    engagementIds.some((id) =>
      billings.some(
        (billing) =>
          billing.invoice_type === 'service_fee' &&
          isActiveBilling(billing) &&
          (billing.engagement_ids?.includes(id) || billing.engagement_id === id)
      )
    );
  const selectedClientKeys = getClientKeys(selectedClient);
  const duplicateRetainer =
    isRetainerFee &&
    selectedClientKeys.length > 0 &&
    billings.some((billing) => {
      const period = getBillingPeriod(billing);
      return (
        billing.invoice_type === 'retainer_fee' &&
        isActiveBilling(billing) &&
        getBillingClientKeys(billing, engagements).some((key) =>
          selectedClientKeys.includes(key)
        ) &&
        period?.month === Number(billingMonth) &&
        period?.year === Number(billingYear)
      );
    });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDueDate = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
  const dueDateInvalid =
    !selectedDueDate ||
    Number.isNaN(selectedDueDate.getTime()) ||
    selectedDueDate < today;

  /* eslint-disable react-hooks/set-state-in-effect */
  // 1) Reset the form whenever the dialog opens.
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
    autoTypeRef.current = false;
  }, [open, initialEngagementId, currentBillingMonth, currentBillingYear]);

  // 2) Prefill the client from the pre-selected engagement (Create Billing
  // from an engagement row). Runs after the reset above; also covers clients
  // loading after the dialog opens.
  useEffect(() => {
    if (!open || !initialClientId) return;
    setClientId(initialClientId);
  }, [open, initialClientId]);

  // 3) Prefill the billing type from the pre-selected engagement.
  // Retainer client + retainer-covered engagement -> Retainer Fee at the
  // client's retainer charge. Retainer client + uncovered engagement ->
  // Service Fee (the service amount is filled by effect 4).
  // autoTypeRef marks the type as auto-set so a later manual change counts
  // as a first choice instead of a type switch that would clear things.
  useEffect(() => {
    if (!open || !initialEngagementId || !initialClientIsRetainer) return;
    autoTypeRef.current = true;
    if (initialEngagementRetainerCovered) {
      setInvoiceType('retainer_fee');
      if (initialRetainerFee != null && initialRetainerFee !== '') {
        setAmount(String(initialRetainerFee));
      }
    } else {
      setInvoiceType('service_fee');
    }
  }, [
    open,
    initialEngagementId,
    initialClientIsRetainer,
    initialEngagementRetainerCovered,
    initialRetainerFee,
  ]);

  // 4) Prefill each selected engagement's amount with its service fee so the
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

  // Picks the error message that matches the actual problem.
  const engagementErrorMessage = () => {
    if (typeof errors.engagement === 'string') return errors.engagement;
    if (isServiceFee) {
      if (selectedEngagements.length === 0)
        return 'Please select at least one engagement.';
      if (duplicateServiceFee)
        return 'One or more selected engagements already have a service fee billing.';
      if (selectedEngagements.some(isEngagementRetainerCovered))
        return 'Retainer-covered engagements cannot get a Service Fee bill.';
    }
    if (
      isRetainerFee &&
      selectedEngagements.some((e) => !isEngagementRetainerCovered(e))
    )
      return 'Retainer Fee bills can only include retainer-covered engagements.';
    return 'Please review the selected engagements.';
  };

  const handleInvoiceTypeChange = (value) => {
    if (isInvoiceTypeDisabled(value, selectedClient)) return;
    if (value === invoiceType) {
      setErrors({});
      return;
    }
    // The client is the anchor of the form, so keep it when switching types
    // unless the new type can't bill it (retainer fee needs a retainer
    // client). An auto-prefilled type counts as the first choice, not a
    // switch, so a pre-selected engagement is kept.
    const switchingTypes = Boolean(invoiceType) && !autoTypeRef.current;
    const retainerIncompatible =
      value === 'retainer_fee' &&
      selectedClient &&
      !isRetainerClient(selectedClient);
    autoTypeRef.current = false;
    setInvoiceType(value);
    if (switchingTypes || retainerIncompatible) {
      setEngagementIds([]);
      setEngagementSearch('');
      setEngagementAmounts({});
    }
    if (retainerIncompatible) {
      setClientId('');
      setClientSearch('');
    }
    if (
      value === 'retainer_fee' &&
      selectedClient &&
      isRetainerClient(selectedClient) &&
      selectedClient.retainerFee != null
    ) {
      setAmount(String(selectedClient.retainerFee));
    } else if (switchingTypes) {
      setAmount('');
    }
    setBillingMonth(String(currentBillingMonth));
    setBillingYear(String(currentBillingYear));
    setErrors({});
  };
  const handleSelectClient = (client) => {
    // Prefill the rest of the form from the client: the billing type follows
    // the client type, and a retainer client's fee seeds the amount.
    const nextType = isRetainerClient(client) ? 'retainer_fee' : 'service_fee';
    setClientId(client.id);
    setClientSearch('');
    setInvoiceType(nextType);
    setAmount(
      nextType === 'retainer_fee' && client.retainerFee != null
        ? String(client.retainerFee)
        : ''
    );
    setEngagementIds([]);
    setEngagementSearch('');
    setEngagementAmounts({});
    autoTypeRef.current = false;
    setErrors({});
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
    if (duplicateRetainer) {
      setErrors((previous) => ({ ...previous, billingPeriod: true }));
      scrollToFirstInvalidField(formRef.current);
      return;
    }

    const trimmedAmount = amount.trim();
    const numericAmount = Number(trimmedAmount);
    const lineAmounts = engagementIds.map((id) =>
      Number(engagementAmounts[id])
    );
    const lineAmountsValid =
      !isServiceFee ||
      (lineAmounts.length > 0 &&
        lineAmounts.every((value) => Number.isFinite(value) && value > 0));
    const schemaErrors = getZodFieldErrors(billingSchema, {
      clientId,
      invoiceType,
      amount: isServiceFee ? serviceTotal : numericAmount,
      dueDate,
      engagementIds,
      billingMonth: billingMonth ? Number(billingMonth) : undefined,
      billingYear: billingYear ? Number(billingYear) : undefined,
    });
    const newErrors = {
      invoiceType: !invoiceType,
      client:
        !clientId || (isRetainerFee && !isRetainerClient(selectedClient)),
      engagement:
        (isServiceFee && (engagementIds.length === 0 || duplicateServiceFee)) ||
        (isRetainerFee &&
          selectedEngagements.some((e) => !isEngagementRetainerCovered(e))) ||
        (isServiceFee && selectedEngagements.some(isEngagementRetainerCovered)),
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
    newErrors.invoiceType ||= Boolean(schemaErrors.invoiceType);
    newErrors.client ||= Boolean(schemaErrors.clientId);
    newErrors.engagement ||= Boolean(schemaErrors.engagementIds);
    newErrors.billingPeriod ||= Boolean(
      schemaErrors.billingMonth || schemaErrors.billingYear
    );
    newErrors.amount ||= Boolean(schemaErrors.amount);
    newErrors.dueDate ||= Boolean(schemaErrors.dueDate);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      scrollToFirstInvalidField(formRef.current);
      return;
    }
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
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <FieldGroup className="space-y-4">
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
                        setEngagementAmounts({});
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
                        aria-invalid={Boolean(errors.client) || undefined}
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
                    {clientId
                      ? 'Retainer fee billing requires a retainer client.'
                      : 'Please select a client.'}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel>
                  Billing Type <span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      aria-invalid={Boolean(errors.invoiceType) || undefined}
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
                    {INVOICE_TYPES.map((type) => {
                      const disabled = isInvoiceTypeDisabled(type, selectedClient);
                      return (
                        <DropdownMenuItem
                          key={type}
                          disabled={disabled}
                          onClick={() => handleInvoiceTypeChange(type)}
                        >
                          <span className="flex flex-col">
                            {invoiceTypeLabels[type]}
                            {disabled && (
                              <span className="text-xs text-muted-foreground">
                                Only available for retainer clients
                              </span>
                            )}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedClient && !isRetainerClient(selectedClient) && (
                  <p className="text-xs text-muted-foreground">
                    This client is not a retainer client, so Retainer Fee is
                    unavailable.
                  </p>
                )}
                {errors.invoiceType && (
                  <p className="text-xs text-red-500">
                    Please select an invoice type.
                  </p>
                )}
              </Field>
              {(isServiceFee || isRetainerFee) && (
                <Field>
                  <FieldLabel>
                    Engagements
                    {isRetainerFee && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    )}
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
                          aria-invalid={Boolean(errors.amount) || undefined}
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
                      aria-invalid={Boolean(errors.engagement) || undefined}
                      value={engagementSearch}
                      onChange={(event) => {
                        setEngagementSearch(event.target.value);
                        setErrors((previous) => ({
                          ...previous,
                          engagement: false,
                        }));
                      }}
                      placeholder={
                        !selectedClient
                          ? 'Select a client first'
                          : 'Search engagement...'
                      }
                      className="pl-9"
                      disabled={engagementsUnavailable || !selectedClient}
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
                            isActiveBilling(billing) &&
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
                      {isRetainerFee
                        ? 'No matching retainer-covered engagements found.'
                        : 'No matching engagements found.'}
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
                      {engagementErrorMessage()}
                    </p>
                  )}
                  {engagementsUnavailable && isServiceFee && (
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
                          aria-invalid={Boolean(errors.billingPeriod) || undefined}
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
                          aria-invalid={Boolean(errors.billingPeriod) || undefined}
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
                  {duplicateRetainer && (
                    <p
                      id="duplicate-retainer-warning"
                      role="alert"
                      className="text-xs text-red-500"
                    >
                      A retainer fee billing already exists for this client for{' '}
                      {selectedBillingPeriod}. Choose a different month or year.
                    </p>
                  )}
                  {errors.billingPeriod && !duplicateRetainer && (
                    <p className="text-xs text-red-500">
                      Please select a billing period.
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
                  aria-invalid={Boolean(errors.amount) || undefined}
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
                  aria-invalid={Boolean(errors.dueDate) || undefined}
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
          </div>
          <DialogFooter className="mt-4 shrink-0 border-t bg-popover pt-4">
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
              disabled={
                submitting ||
                duplicateRetainer ||
                (isServiceFee && engagementsUnavailable)
              }
              aria-describedby={
                duplicateRetainer ? 'duplicate-retainer-warning' : undefined
              }
              className="bg-forest-900 text-white hover:opacity-90 disabled:hover:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Billing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}