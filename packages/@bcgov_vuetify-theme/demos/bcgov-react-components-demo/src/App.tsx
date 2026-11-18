import "@bcgov/bc-sans/css/BC_Sans.css";
import { useEffect } from "react";

import {
  Accordion,
  AccordionGroup,
  AlertBanner,
  AlertDialog,
  Button,
  ButtonGroup,
  Calendar,
  Callout,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Dialog,
  DialogTrigger,
  Footer,
  Form,
  Header,
  Heading,
  InlineAlert,
  Link,
  Menu,
  MenuTrigger,
  Modal,
  NumberField,
  ProgressBar,
  ProgressCircle,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Subheader,
  Switch,
  Tag,
  TagGroup,
  TagList,
  Text,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  SvgBcLogo,
  SvgBcOutlineIcon,
  SvgBetaIcon,
  SvgCalendarIcon,
  SvgCheckIcon,
  SvgCheckCircleIcon,
  SvgChevronDownIcon,
  SvgChevronLeftIcon,
  SvgChevronRightIcon,
  SvgChevronUpIcon,
  SvgCloseIcon,
  SvgExclamationIcon,
  SvgExclamationCircleIcon,
  SvgInfoIcon,
  SvgMinusIcon,
  SvgPlaceholderIcon,
  SvgPlusIcon,
  SvgReactAriaIcon,
  SvgUpRightFromSquareIcon,
} from "@bcgov/design-system-react-components";

type SectionProps = {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
};

function Section({ id, title, note, children }: SectionProps) {
  return (
    <details
      className="section"
      id={id}
      aria-labelledby={`${id}-title`}
      open
    >
      <summary>
        <h2 id={`${id}-title`}>{title}</h2>
      </summary>
      {note && <p className="section-note">{note}</p>}
      {children}
    </details>
  );
}

const provinces = [
  { id: "bc", label: "British Columbia" },
  { id: "ab", label: "Alberta" },
];

const actions = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { id: "archive", label: "Archive" },
];

const skills = [
  { id: "ts", textValue: "TypeScript", color: "bc-blue" as const },
  { id: "react", textValue: "React", color: "green" as const },
];

const icons: [string, React.ReactElement][] = [
  ["SvgBcLogo", <SvgBcLogo />],
  ["SvgBcOutlineIcon", <SvgBcOutlineIcon />],
  ["SvgBetaIcon", <SvgBetaIcon />],
  ["SvgCalendarIcon", <SvgCalendarIcon />],
  ["SvgCheckIcon", <SvgCheckIcon />],
  ["SvgCheckCircleIcon", <SvgCheckCircleIcon />],
  ["SvgChevronDownIcon", <SvgChevronDownIcon />],
  ["SvgChevronLeftIcon", <SvgChevronLeftIcon />],
  ["SvgChevronRightIcon", <SvgChevronRightIcon />],
  ["SvgChevronUpIcon", <SvgChevronUpIcon />],
  ["SvgCloseIcon", <SvgCloseIcon />],
  ["SvgExclamationIcon", <SvgExclamationIcon />],
  ["SvgExclamationCircleIcon", <SvgExclamationCircleIcon />],
  ["SvgInfoIcon", <SvgInfoIcon />],
  ["SvgMinusIcon", <SvgMinusIcon />],
  ["SvgPlaceholderIcon", <SvgPlaceholderIcon />],
  ["SvgPlusIcon", <SvgPlusIcon />],
  ["SvgReactAriaIcon", <SvgReactAriaIcon />],
  ["SvgUpRightFromSquareIcon", <SvgUpRightFromSquareIcon />],
];

export default function App() {
  useEffect(() => {
    // while reviewing the page, it becomes unneccessary to review all sections, so collapse all the reviewed sections.
    const sectionCountToCollapse = 0;
    document
      .querySelectorAll<HTMLDetailsElement>("main.page details.section")
      .forEach((section, index) => {
        if (index < sectionCountToCollapse) {
          section.open = false;
        }
      });
  }, []);

  return (
    <>
      <Header title="BC Design System Components" />

      <main className="page">
<h1>Navigation and Structure</h1>

        <Section id="header" title="Header">
          <Header title="Example header" />
        </Section>        

        <Section id="subheader" title="Subheader">
          <Subheader ariaLabel="Section navigation">
            <Link href="#overview">Overview</Link>
            <Link href="#details">Details</Link>
            <Link href="#contact">Contact</Link>
          </Subheader>
        </Section>
        
        <Section id="footer" title="Footer">
          <Footer />
        </Section>

        <Section id="menu" title="Menu">
          <MenuTrigger>
            <Button variant="secondary">Actions</Button>
            <Menu items={actions} />
          </MenuTrigger>
        </Section>

<h1>Inputs and Controls</h1>

        <Section id="button" title="Button">
          <div className="row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="link">Link</Button>
            <Button size="large">Large</Button>
            <Button size="medium">Medium</Button>
            <Button size="small">Small</Button>
            <Button size="xsmall">xsmall</Button>
            <Button danger>Danger</Button>
          </div>
        </Section>

        <Section id="button-group" title="ButtonGroup">
          <ButtonGroup aria-label="Example actions">
            <Button variant="secondary">Back</Button>
            <Button>Next</Button>
          </ButtonGroup>
        </Section>

        <Section id="calendar" title="Calendar">
          <Calendar aria-label="Appointment date" />
        </Section>

        <Section id="checkbox" title="Checkbox">
          <Checkbox>Unchecked option</Checkbox>
          <Checkbox defaultSelected>Checked option</Checkbox>
        </Section>

        <Section id="checkbox-group" title="CheckboxGroup">
          <CheckboxGroup label="Notifications">
            <Checkbox value="email">Email</Checkbox>
            <Checkbox value="sms">SMS</Checkbox>
          </CheckboxGroup>
        </Section>

        <Section id="date-picker" title="DatePicker">
          <DatePicker label="Start date" />
        </Section>

        <Section id="number-field" title="NumberField">
          <NumberField label="Quantity" defaultValue={1} minValue={0} />
        </Section>

        <Section id="radio-group" title="RadioGroup and Radio">
          <RadioGroup label="Preferred contact">
            <Radio value="email">Email</Radio>
            <Radio value="phone">Phone</Radio>
          </RadioGroup>
        </Section>

        <Section id="select" title="Select">
          <Select label="Province" placeholder="Select a province" items={provinces} />
        </Section>

        <Section id="switch" title="Switch">
          <Switch>Enable notifications</Switch>
        </Section>

        <Section id="tag-group" title="TagGroup, TagList and Tag">
          <TagGroup label="Skills">
            <TagList items={skills} />
          </TagGroup>
        </Section>

        <Section id="text-area" title="TextArea">
          <TextArea label="Comments" />
        </Section>

        <Section id="text-field" title="TextField">
          <TextField label="Full name" description="Enter your legal name." />
        </Section>

        <Section id="time-field" title="TimeField">
          <TimeField label="Start time" />
        </Section>

        <Section id="toggle-button" title="ToggleButton and ToggleButtonGroup">
          <ToggleButtonGroup label="Text alignment" selectionMode="single" defaultSelectedKeys={["left"]}>
            <ToggleButton id="left">Left</ToggleButton>
            <ToggleButton id="center">Center</ToggleButton>
            <ToggleButton id="right">Right</ToggleButton>
          </ToggleButtonGroup>
        </Section>

<h1>Notifications and Feedback</h1>

        <Section id="alert-banner" title="AlertBanner">
          <div className="stack">
            <AlertBanner variant="info">Information banner.</AlertBanner>
            <AlertBanner variant="success">Success banner.</AlertBanner>
            <AlertBanner variant="warning">Warning banner.</AlertBanner>
            <AlertBanner variant="danger">Danger banner.</AlertBanner>
          </div>
        </Section>

        <Section id="dialog" title="Dialog and Modal">
          <DialogTrigger>
            <Button variant="secondary">Open dialog</Button>
            <Modal>
              <Dialog>
                <Heading slot="title" level={2}>
                  Dialog title
                </Heading>
                <Text>Dialog content goes here.</Text>
                <Button slot="close">Close</Button>
              </Dialog>
            </Modal>
          </DialogTrigger>
        </Section>

        <Section id="alert-dialog" title="AlertDialog">
          <DialogTrigger>
            <Button variant="secondary">Open alert dialog</Button>
            <Modal>
              <AlertDialog
                variant="warning"
                title="Confirm action"
                buttons={
                  <ButtonGroup>
                    <Button slot="close" variant="secondary">
                      Cancel
                    </Button>
                    <Button slot="close">Continue</Button>
                  </ButtonGroup>
                }
              >
                Are you sure you want to continue?
              </AlertDialog>
            </Modal>
          </DialogTrigger>
        </Section>

        <Section id="inline-alert" title="InlineAlert">
          <div className="stack">
            <InlineAlert variant="info" title="Info">
              Information message.
            </InlineAlert>
            <InlineAlert variant="success" title="Success">
              Success message.
            </InlineAlert>
            <InlineAlert variant="warning" title="Warning">
              Warning message.
            </InlineAlert>
            <InlineAlert variant="danger" title="Danger">
              Danger message.
            </InlineAlert>
          </div>
        </Section>

        <Section id="progress-bar" title="ProgressBar">
          <ProgressBar label="Uploading" value={60} />
        </Section>

        <Section id="progress-circle" title="ProgressCircle">
          <ProgressCircle aria-label="Loading" value={40} />
        </Section>

        <Section id="tooltip" title="Tooltip">
          <TooltipTrigger>
            <Button variant="secondary">Hover or focus me</Button>
            <Tooltip>Helpful hint</Tooltip>
          </TooltipTrigger>
        </Section>

<h1>Content</h1>

        <Section id="accordion" title="Accordion and AccordionGroup">
          <AccordionGroup title="Accordion group">
            <Accordion label="First section">
              <Text>Content for the first section.</Text>
            </Accordion>
            <Accordion label="Second section">
              <Text>Content for the second section.</Text>
            </Accordion>
          </AccordionGroup>
        </Section>

        <Section id="callout" title="Callout">
          <Callout variant="lightBlue" title="Callout title">
            Callout body text.
          </Callout>
        </Section>
        
<h1>Utility</h1>

        <Section id="form" title="Form">
          <Form>
            <TextField label="Name" />
            <Button type="submit">Submit</Button>
          </Form>
        </Section>

        <Section id="heading" title="Heading">
          <Heading level={1}>Heading level 1</Heading>
          <Heading level={2}>Heading level 2</Heading>
          <Heading level={3}>Heading level 3</Heading>
          <Heading level={4}>Heading level 4</Heading>
          <Heading level={5}>Heading level 5</Heading>
          <Heading level={6}>Heading level 6</Heading>
        </Section>

        <Section id="link" title="Link">
          <Link href="https://www2.gov.bc.ca">gov.bc.ca</Link>
        </Section>

        <Section id="text" title="Text">
          <Text size="small">Small text.</Text>
          <Text>Medium text.</Text>
          <Text size="large">Large text.</Text>
        </Section>

        <Section id="separator" title="Separator">
          <Text>Content above the separator.</Text>
          <Separator />
          <Text>Content below the separator.</Text>
        </Section>




        <Section id="icons" title="Icons">
          <div className="icon-grid">
            {icons.map(([name, icon]) => (
              <div className="icon-cell" key={name}>
                {icon}
                <span>{name}</span>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}