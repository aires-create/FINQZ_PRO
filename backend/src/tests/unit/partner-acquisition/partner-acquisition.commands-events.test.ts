import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARTNER_ACQUISITION_AGGREGATE_TYPES,
  PARTNER_ACQUISITION_EVENT_TYPES,
  PARTNER_ACQUISITION_REFERENCE_KINDS,
  PARTNER_ACQUISITION_SOURCES,
  type PartnerAcquisitionAggregateType,
  type PartnerAcquisitionCommandMetadata,
  type PartnerAcquisitionEventMetadata,
  type PartnerAcquisitionReference,
  type PartnerAcquisitionSource,
} from '../../../modules/partner-acquisition/domain/partner-acquisition.contract.js';
import {
  PARTNER_ACQUISITION_COMMAND_TYPES,
  type ApprovePartnerProspectConversionCommand,
  type ConvertPartnerProspectToPartnerCommand,
  type CreatePartnerLeadCommand,
  type CreatePartnerProspectCommand,
  type DisqualifyPartnerProspectCommand,
  type MarkPartnerProspectContractSignedCommand,
  type MarkPartnerProspectDocumentationReceivedCommand,
  type MovePartnerProspectToNegotiationCommand,
  type QualifyPartnerProspectCommand,
  type RejectPartnerProspectConversionCommand,
  type RequestPartnerProspectContractCommand,
  type RequestPartnerProspectDocumentationCommand,
} from '../../../modules/partner-acquisition/domain/partner-acquisition.commands.js';
import {
  PARTNER_ACQUISITION_EVENT_NAMES,
  type PartnerLeadCreatedEvent,
  type PartnerProspectContractSignedEvent,
  type PartnerProspectConvertedToPartnerEvent,
  type PartnerProspectCreatedEvent,
  type PartnerProspectConversionApprovedEvent,
  type PartnerProspectConversionRejectedEvent,
  type PartnerProspectDisqualifiedEvent,
  type PartnerProspectDocumentationReceivedEvent,
  type PartnerProspectDocumentationRequestedEvent,
  type PartnerProspectMovedToNegotiationEvent,
  type PartnerProspectQualifiedEvent,
  type PartnerProspectContractRequestedEvent,
} from '../../../modules/partner-acquisition/domain/partner-acquisition.events.js';

const commandsPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-acquisition.commands.ts',
);

const eventsPath = resolve(
  process.cwd(),
  'src/modules/partner-acquisition/domain/partner-acquisition.events.ts',
);

const commandsSource = readFileSync(commandsPath, 'utf8');
const eventsSource = readFileSync(eventsPath, 'utf8');

const commandEnvelope = {
  tenantId: 'tenant-1',
  actorUserId: 'user-1',
  requestId: 'req-1',
  correlationId: 'corr-1',
  idempotencyKey: 'idem-1',
  requestedAt: '2026-06-25T00:00:00.000Z',
  source: 'SDR_IA' as PartnerAcquisitionSource,
  references: [
    {
      kind: 'FEEDER',
      refType: 'SDR_IA',
      refId: 'hub-1',
      refLabel: 'SDR IA',
    },
    {
      kind: 'SUBSTRATE',
      refType: 'PIPELINE',
      refId: 'parceiros_comerciais',
      refLabel: 'Parceiros Comerciais',
    },
  ] satisfies PartnerAcquisitionReference[],
  metadata: {
    source: 'SDR_IA' as PartnerAcquisitionSource,
    pipelineCode: 'parceiros_comerciais',
    stageCode: 'documentacao',
    sdrAgentId: 'agent-1',
    automationCode: 'auto-criar-parceiro',
    campaignId: 'campaign-1',
    trace: { wave: 'H16E' },
  } satisfies PartnerAcquisitionCommandMetadata,
} as const;

const eventEnvelope = {
  eventId: 'evt-1',
  tenantId: 'tenant-1',
  aggregateId: 'prospect-1',
  aggregateType: 'PARTNER_PROSPECT' as PartnerAcquisitionAggregateType,
  eventType: 'PartnerProspectCreated',
  actorUserId: 'user-1',
  requestId: 'req-1',
  correlationId: 'corr-1',
  idempotencyKey: 'idem-1',
  occurredAt: '2026-06-25T00:00:00.000Z',
  source: 'CAMPAIGN' as PartnerAcquisitionSource,
  references: [
    {
      kind: 'FEEDER',
      refType: 'CAMPAIGN',
      refId: 'campaign-1',
      refLabel: 'Campanha Junho',
    },
    {
      kind: 'SUBSTRATE',
      refType: 'PIPELINE',
      refId: 'parceiros_comerciais',
      refLabel: 'Parceiros Comerciais',
    },
  ] satisfies PartnerAcquisitionReference[],
  metadata: {
    source: 'CAMPAIGN' as PartnerAcquisitionSource,
    previousStatus: 'NEW',
    nextStatus: 'CONTACTED',
    reason: 'Entrada de campanha',
    trace: { wave: 'H16E' },
  } satisfies PartnerAcquisitionEventMetadata,
} as const;

describe('partner-acquisition.commands-events', () => {
  it('exports the complete command type union', () => {
    expect(PARTNER_ACQUISITION_COMMAND_TYPES).toEqual([
      'CreatePartnerLeadCommand',
      'CreatePartnerProspectCommand',
      'QualifyPartnerProspectCommand',
      'DisqualifyPartnerProspectCommand',
      'MovePartnerProspectToNegotiationCommand',
      'RequestPartnerProspectDocumentationCommand',
      'MarkPartnerProspectDocumentationReceivedCommand',
      'RequestPartnerProspectContractCommand',
      'MarkPartnerProspectContractSignedCommand',
      'ApprovePartnerProspectConversionCommand',
      'RejectPartnerProspectConversionCommand',
      'ConvertPartnerProspectToPartnerCommand',
    ]);
  });

  it('exports the complete event type union', () => {
    expect(PARTNER_ACQUISITION_EVENT_NAMES).toEqual([
      'PartnerLeadCreated',
      'PartnerProspectCreated',
      'PartnerProspectQualified',
      'PartnerProspectDisqualified',
      'PartnerProspectMovedToNegotiation',
      'PartnerProspectDocumentationRequested',
      'PartnerProspectDocumentationReceived',
      'PartnerProspectContractRequested',
      'PartnerProspectContractSigned',
      'PartnerProspectConversionApproved',
      'PartnerProspectConversionRejected',
      'PartnerProspectConvertedToPartner',
    ]);
  });

  it('requires tenant, actor, request, correlation, idempotency and requestedAt in every command', () => {
    const createLead: CreatePartnerLeadCommand = {
      ...commandEnvelope,
      commandType: 'CreatePartnerLeadCommand',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      email: 'parceiro@example.com',
      phone: '+5511999999999',
      companyName: 'Parceiro Exemplo LTDA',
      document: '12345678000190',
    };

    const createProspect: CreatePartnerProspectCommand = {
      ...commandEnvelope,
      commandType: 'CreatePartnerProspectCommand',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      fullName: 'Parceiro Exemplo',
      initialStatus: 'NEW',
    };

    const qualify: QualifyPartnerProspectCommand = {
      ...commandEnvelope,
      commandType: 'QualifyPartnerProspectCommand',
      prospectId: 'prospect-1',
      score: 87,
      qualificationReason: 'Perfil aderente',
    };

    const disqualify: DisqualifyPartnerProspectCommand = {
      ...commandEnvelope,
      commandType: 'DisqualifyPartnerProspectCommand',
      prospectId: 'prospect-1',
      reason: 'Sem aderência comercial',
    };

    const negotiation: MovePartnerProspectToNegotiationCommand = {
      ...commandEnvelope,
      commandType: 'MovePartnerProspectToNegotiationCommand',
      prospectId: 'prospect-1',
      negotiationReason: 'Avançar para proposta',
    };

    const requestDocs: RequestPartnerProspectDocumentationCommand = {
      ...commandEnvelope,
      commandType: 'RequestPartnerProspectDocumentationCommand',
      prospectId: 'prospect-1',
      requestedDocuments: ['CNPJ', 'Contrato social'],
      dueAt: '2026-06-30T00:00:00.000Z',
    };

    const docsReceived: MarkPartnerProspectDocumentationReceivedCommand = {
      ...commandEnvelope,
      commandType: 'MarkPartnerProspectDocumentationReceivedCommand',
      prospectId: 'prospect-1',
      receivedDocuments: ['CNPJ', 'Contrato social'],
    };

    const requestContract: RequestPartnerProspectContractCommand = {
      ...commandEnvelope,
      commandType: 'RequestPartnerProspectContractCommand',
      prospectId: 'prospect-1',
      contractTemplateCode: 'PARTNER_STD',
      contractReference: 'ctr-1',
    };

    const signed: MarkPartnerProspectContractSignedCommand = {
      ...commandEnvelope,
      commandType: 'MarkPartnerProspectContractSignedCommand',
      prospectId: 'prospect-1',
      signedAt: '2026-06-25T00:00:00.000Z',
      contractReference: 'ctr-1',
      signatureProvider: 'clicksign',
    };

    const approve: ApprovePartnerProspectConversionCommand = {
      ...commandEnvelope,
      commandType: 'ApprovePartnerProspectConversionCommand',
      prospectId: 'prospect-1',
      approvalNotes: 'Conversão aprovada',
    };

    const reject: RejectPartnerProspectConversionCommand = {
      ...commandEnvelope,
      commandType: 'RejectPartnerProspectConversionCommand',
      prospectId: 'prospect-1',
      reason: 'Documentação inválida',
    };

    const convert: ConvertPartnerProspectToPartnerCommand = {
      ...commandEnvelope,
      commandType: 'ConvertPartnerProspectToPartnerCommand',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
      aggregateType: 'PARTNER_PROSPECT',
      conversionApprovedAt: '2026-06-25T00:00:00.000Z',
    };

    const commands = [
      createLead,
      createProspect,
      qualify,
      disqualify,
      negotiation,
      requestDocs,
      docsReceived,
      requestContract,
      signed,
      approve,
      reject,
      convert,
    ];

    for (const command of commands) {
      expect(command.tenantId).toBe('tenant-1');
      expect(command.actorUserId).toBe('user-1');
      expect(command.requestId).toBe('req-1');
      expect(command.correlationId).toBe('corr-1');
      expect(command.idempotencyKey).toBe('idem-1');
      expect(command.requestedAt).toBe('2026-06-25T00:00:00.000Z');
    }

    expect(convert.aggregateType).toBe('PARTNER_PROSPECT');
  });

  it('requires event envelopes to carry ids, correlation and tenant scope', () => {
    const created: PartnerLeadCreatedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerLeadCreated',
      aggregateType: 'PARTNER_LEAD',
      aggregateId: 'lead-1',
      leadId: 'lead-1',
      leadStatus: 'NEW',
      channel: 'CAMPAIGN',
      fullName: 'Parceiro Exemplo',
    };

    const prospectCreated: PartnerProspectCreatedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectCreated',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      leadId: 'lead-1',
      status: 'NEW',
    };

    const qualified: PartnerProspectQualifiedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectQualified',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      score: 87,
      qualificationReason: 'Perfil aderente',
      previousStatus: 'CONTACTED',
      nextStatus: 'QUALIFIED',
    };

    const disqualified: PartnerProspectDisqualifiedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectDisqualified',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      reason: 'Sem aderência',
      previousStatus: 'NEW',
      nextStatus: 'LOST',
    };

    const negotiation: PartnerProspectMovedToNegotiationEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectMovedToNegotiation',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      negotiationReason: 'Avançar para proposta',
      previousStatus: 'QUALIFIED',
      nextStatus: 'NEGOTIATING',
    };

    const docsRequested: PartnerProspectDocumentationRequestedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectDocumentationRequested',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      requestedDocuments: ['CNPJ'],
      dueAt: '2026-06-30T00:00:00.000Z',
      previousStatus: 'NEGOTIATING',
      nextStatus: 'DOCUMENTATION',
    };

    const docsReceived: PartnerProspectDocumentationReceivedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectDocumentationReceived',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      receivedDocuments: ['CNPJ'],
      previousStatus: 'DOCUMENTATION',
      nextStatus: 'CONTRACT_PENDING',
    };

    const contractRequested: PartnerProspectContractRequestedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectContractRequested',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      contractTemplateCode: 'PARTNER_STD',
      contractReference: 'ctr-1',
      previousStatus: 'DOCUMENTATION',
      nextStatus: 'CONTRACT_PENDING',
    };

    const contractSigned: PartnerProspectContractSignedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectContractSigned',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      signedAt: '2026-06-25T00:00:00.000Z',
      contractReference: 'ctr-1',
      signatureProvider: 'clicksign',
      previousStatus: 'CONTRACT_PENDING',
      nextStatus: 'SIGNED',
    };

    const conversionApproved: PartnerProspectConversionApprovedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectConversionApproved',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      approvalNotes: 'Aprovado',
      previousStatus: 'SIGNED',
      nextStatus: 'CONVERSION_PENDING',
    };

    const conversionRejected: PartnerProspectConversionRejectedEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectConversionRejected',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      reason: 'Compliance',
      previousStatus: 'SIGNED',
      nextStatus: 'REJECTED',
    };

    const converted: PartnerProspectConvertedToPartnerEvent = {
      ...eventEnvelope,
      eventType: 'PartnerProspectConvertedToPartner',
      aggregateType: 'PARTNER_PROSPECT',
      aggregateId: 'prospect-1',
      prospectId: 'prospect-1',
      partnerId: 'partner-1',
      partnerCode: 'P-001',
      partnerName: 'Parceiro Exemplo LTDA',
      partnerType: 'COMPANY',
      previousStatus: 'CONVERSION_PENDING',
      nextStatus: 'CONVERTED',
    };

    const events = [
      created,
      prospectCreated,
      qualified,
      disqualified,
      negotiation,
      docsRequested,
      docsReceived,
      contractRequested,
      contractSigned,
      conversionApproved,
      conversionRejected,
      converted,
    ];

    for (const event of events) {
      expect(event.eventId).toBe('evt-1');
      expect(event.aggregateId).toBeTruthy();
      expect(event.requestId).toBe('req-1');
      expect(event.correlationId).toBe('corr-1');
      expect(event.tenantId).toBe('tenant-1');
    }

    expect(new Set(events.map((event) => event.aggregateId))).toEqual(new Set(['lead-1', 'prospect-1']));
    expect(converted.partnerId).toBe('partner-1');
  });

  it('keeps Opportunity out of the aggregate type surface', () => {
    const aggregateTypes: PartnerAcquisitionAggregateType[] = PARTNER_ACQUISITION_AGGREGATE_TYPES;

    expect(aggregateTypes).toEqual(['PARTNER_LEAD', 'PARTNER_PROSPECT', 'PARTNER']);
    expect(aggregateTypes).not.toContain('OPPORTUNITY');
  });

  it('keeps Pipeline only as reference or substrate and keeps automation out of source-of-truth semantics', () => {
    const pipelineReference = eventEnvelope.references?.find((reference) => reference.refType === 'PIPELINE');

    expect(pipelineReference?.kind).toBe('SUBSTRATE');
    expect(pipelineReference?.refId).toBe('parceiros_comerciais');
    expect(PARTNER_ACQUISITION_REFERENCE_KINDS).toContain('SUBSTRATE');
    expect(PARTNER_ACQUISITION_REFERENCE_KINDS).toContain('FEEDER');
    expect(PARTNER_ACQUISITION_REFERENCE_KINDS).toContain('HANDLER');
    expect(PARTNER_ACQUISITION_SOURCES).not.toContain('AUTOMATION' as PartnerAcquisitionSource);
  });

  it('keeps signed-event semantics separate from partner creation and conversion semantics', () => {
    const signedBlock =
      eventsSource.match(
        /export interface PartnerProspectContractSignedEvent[\s\S]*?export interface PartnerProspectConversionApprovedEvent/,
      )?.[0] ?? '';

    const convertedBlock =
      eventsSource.match(
        /export interface PartnerProspectConvertedToPartnerEvent[\s\S]*?export type PartnerAcquisitionEvent/,
      )?.[0] ?? '';

    expect(signedBlock).not.toMatch(/partnerId\s*:/i);
    expect(signedBlock).not.toMatch(/aggregateType:\s*'PARTNER'\b/i);
    expect(convertedBlock).toMatch(/partnerId\s*:\s*string/);
  });

  it('keeps the contracts append-only in intent and free of runtime imports', () => {
    expect(commandsSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http|opportunity)[^'"]*['"]/i);
    expect(eventsSource).not.toMatch(/from\s+['"][^'"]*(fastify|prisma|repository|service|controller|http|opportunity)[^'"]*['"]/i);
    expect(commandsSource).toContain('as const');
    expect(eventsSource).toContain('as const');
    expect(commandsSource).not.toMatch(/\.push\(|\.splice\(|\.pop\(|\.shift\(/);
    expect(eventsSource).not.toMatch(/\.push\(|\.splice\(|\.pop\(|\.shift\(/);
  });
});
