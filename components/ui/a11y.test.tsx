// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, it } from "vitest"
import { expectNoA11yViolations } from "@/tests/a11y"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { EmptyState } from "./empty-state"
import { Input } from "./input"
import { Label } from "./label"
import { Switch } from "./switch"

afterEach(cleanup)

describe("components/ui accessibility (axe)", () => {
  it("Button with text and icon-only Button with aria-label", async () => {
    const { container } = render(
      <main>
        <Button>Guardar</Button>
        <Button aria-label="Fechar" size="icon">
          ×
        </Button>
      </main>
    )
    await expectNoA11yViolations(container)
  })

  it("form fields paired with labels", async () => {
    const { container } = render(
      <main>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" />
        <Label htmlFor="terms">Aceito</Label>
        <Checkbox id="terms" />
        <Label htmlFor="notify">Notificações</Label>
        <Switch id="notify" />
      </main>
    )
    await expectNoA11yViolations(container)
  })

  it("Alert and EmptyState", async () => {
    const { container } = render(
      <main>
        <Alert>
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>Algo aconteceu.</AlertDescription>
        </Alert>
        <EmptyState title="Sem tarefas" description="Crie a primeira." action={<Button>Criar</Button>} />
      </main>
    )
    await expectNoA11yViolations(container)
  })

  it("the harness catches a real violation (an unlabelled input)", async () => {
    const { container } = render(
      <main>
        <Input />
      </main>
    )
    await expectNoA11yViolations(container).then(
      () => {
        throw new Error("axe should have reported the missing label")
      },
      () => undefined
    )
  })
})
