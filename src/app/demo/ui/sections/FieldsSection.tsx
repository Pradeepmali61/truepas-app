import { useState } from "react";
import { View } from "react-native";
import { Mail } from "lucide-react-native";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { FormField } from "@/components/composite/FormField";
import { SearchBox } from "@/components/composite/SearchBox";
import { OtpInput } from "@/components/composite/OtpInput";
import { DatePicker } from "@/components/composite/DatePicker";
import { Demo, ShowcasePage, Section } from "../demos";

const COUNTRIES = [
  { value: "in", label: "India" },
  { value: "us", label: "United States" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "sg", label: "Singapore" },
  { value: "zz", label: "Atlantis (disabled)", disabled: true },
];

export function FieldsSection() {
  const theme = useThemeTokens();
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<string>();
  const [checks, setChecks] = useState({ a: false, b: true, c: "indeterminate" as boolean | "indeterminate" });
  const [plan, setPlan] = useState("pro");
  const [otp, setOtp] = useState("");
  const [dob, setDob] = useState<string>();
  const [search, setSearch] = useState("");

  const emailErr =
    email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Please enter a valid email address." : undefined;

  return (
    <ShowcasePage>
      <Section title="Input">
        <Demo label="states">
          <Input placeholder="Default" />
          <Input placeholder="Error" state="error" />
          <Input placeholder="Success" state="success" defaultValue="priya@truepas.com" />
          <Input placeholder="Disabled" editable={false} />
          <Input placeholder="With icon" iconLeft={<Mail size={iconSize.sm} color={theme.colors.textMuted} />} />
        </Demo>
        <Demo label="sizes">
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
        </Demo>
      </Section>

      <Section title="Textarea">
        <Textarea placeholder="Tell us about yourself" rows={4} />
        <Textarea state="error" defaultValue="too short" rows={2} />
      </Section>

      <Section title="Select (bottom-sheet picker)">
        <Select
          options={COUNTRIES}
          value={country}
          onValueChange={setCountry}
          placeholder="Choose a country"
          title="Country"
        />
        <Select options={COUNTRIES} placeholder="Error state" state="error" />
        <Select options={COUNTRIES} placeholder="Disabled" disabled />
      </Section>

      <Section title="Checkbox">
        <View style={{ gap: 16 }}>
          <Checkbox label="Unchecked" checked={checks.a} onCheckedChange={(v) => setChecks((s) => ({ ...s, a: v }))} />
          <Checkbox label="Checked" checked={checks.b} onCheckedChange={(v) => setChecks((s) => ({ ...s, b: v }))} />
          <Checkbox label="Indeterminate" checked={checks.c} onCheckedChange={(v) => setChecks((s) => ({ ...s, c: v }))} />
          <Checkbox label="Error" state="error" />
          <Checkbox label="Disabled" description="Cannot change" disabled />
        </View>
      </Section>

      <Section title="RadioGroup">
        <RadioGroup
          value={plan}
          onValueChange={setPlan}
          options={[
            { value: "free", label: "Free", description: "Basic check-in" },
            { value: "pro", label: "Pro", description: "Face + documents" },
            { value: "ent", label: "Enterprise", disabled: true },
          ]}
        />
      </Section>

      <Section title="Switch">
        <Switch label="Booking notifications" description="Email + SMS" />
        <Switch label="Enabled" value />
        <Switch label="Disabled" disabled />
      </Section>

      <Section title="FormField (label + validation wiring)">
        <FormField label="Email" required description="Used for account notifications." error={emailErr} success={email && !emailErr ? "Looks good." : undefined}>
          <Input
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
          />
        </FormField>
        <FormField label="Full name" helperText="As on your government ID.">
          <Input placeholder="Priya Nair" />
        </FormField>
      </Section>

      <Section title="SearchBox">
        <SearchBox value={search} onChange={setSearch} placeholder="Search bookingsâ€¦" />
        <SearchBox loading placeholder="Searchingâ€¦" />
        <SearchBox disabled placeholder="Disabled" />
      </Section>

      <Section title="OtpInput â€” verify-otp flow">
        <OtpInput value={otp} onChange={setOtp} onComplete={() => {}} />
        <OtpInput value="123" state="error" />
        <OtpInput length={4} value={otp} onChange={setOtp} />
      </Section>

      <Section title="DatePicker (calendar sheet)">
        <DatePicker value={dob} onValueChange={setDob} placeholder="Date of birth" minDate="1950-01-01" maxDate="2026-12-31" />
        <DatePicker placeholder="Error state" state="error" />
      </Section>
    </ShowcasePage>
  );
}

