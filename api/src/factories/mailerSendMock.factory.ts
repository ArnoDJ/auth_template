export class MockEmailParams {
  public from?: string
  public to?: string[]
  public subject?: string
  public html?: string
  public text?: string

  public setFrom(from: string): this {
    this.from = from
    return this
  }

  public setTo(to: string[]): this {
    this.to = to
    return this
  }

  public setSubject(subject: string): this {
    this.subject = subject
    return this
  }

  public setHtml(html: string): this {
    this.html = html
    return this
  }

  public setText(text: string): this {
    this.text = text
    return this
  }
}

type SendMock = jest.MockedFunction<(message: MockEmailParams) => Promise<void>>
type MailerSendMock = jest.MockedFunction<
  (config: { username: string; key: string; url?: string }) => {
    messages: {
      create: (domain: string, message: MockEmailParams) => Promise<void>
    }
  }
>

export type MailerSendMocks = {
  mockSend: SendMock
  mockMailerSend: MailerSendMock
  reset: () => void
}

type MailerSendModuleMock = {
  __esModule: true
  default: jest.MockedFunction<() => { client: MailerSendMock }>
}
const buildMailerSendMocks = (): MailerSendMocks => {
  const mockSend: SendMock = jest.fn<Promise<void>, [MockEmailParams]>()
  const mockMailerSend: MailerSendMock = jest.fn((_config) => ({
    messages: {
      create: async (_domain: string, message: MockEmailParams) => {
        await mockSend(message)
      },
    },
  }))

  const reset = (): void => {
    mockSend.mockResolvedValue(undefined)
    mockSend.mockClear()
    mockMailerSend.mockClear()
  }

  return {
    mockSend,
    mockMailerSend,
    reset,
  }
}

let currentMailerSendMocks: MailerSendMocks | undefined
export const getMailerSendMocks = (): MailerSendMocks => {
  currentMailerSendMocks ??= buildMailerSendMocks()

  return currentMailerSendMocks
}

export const buildMailerSendModuleMock = (): MailerSendModuleMock => {
  const mocks = getMailerSendMocks()

  return {
    __esModule: true,
    default: jest.fn(() => ({
      client: mocks.mockMailerSend,
    })),
  }
}
