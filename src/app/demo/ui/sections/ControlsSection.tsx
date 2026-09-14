import { View } from "react-native";
import { Bell, Download, Plus, Settings } from "lucide-react-native";
import { useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Link } from "@/components/ui/Link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { Demo, ShowcasePage, Section } from "../demos";

export function ControlsSection() {
  const theme = useThemeTokens();
  const muted = theme.colors.textSecondary;

  return (
    <ShowcasePage>
      <Section title="Button">
        <Demo label="variants" row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
        </Demo>
        <Demo label="sizes" row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Demo>
        <Demo label="states" row>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button iconLeft={<Download size={iconSize.sm} color={theme.colors.onActionPrimary} />}>Export</Button>
          <Button iconRight={<Plus size={iconSize.sm} color={theme.colors.onActionPrimary} />}>New</Button>
        </Demo>
        <Demo label="full width">
          <Button fullWidth>Continue</Button>
        </Demo>
      </Section>

      <Section title="IconButton">
        <Demo label="variants" row>
          {(["primary", "secondary", "outline", "ghost", "destructive"] as const).map((v) => (
            <IconButton
              key={v}
              accessibilityLabel={v}
              variant={v}
              icon={
                <Settings
                  size={iconSize.md}
                  color={v === "primary" || v === "destructive" ? theme.colors.onActionPrimary : muted}
                />
              }
            />
          ))}
          <IconButton accessibilityLabel="loading" loading icon={<Bell size={iconSize.md} />} />
          <IconButton accessibilityLabel="disabled" disabled icon={<Bell size={iconSize.md} color={muted} />} />
        </Demo>
      </Section>

      <Section title="Link">
        <Demo row>
          <Link onPress={() => {}}>Default link</Link>
          <Link onPress={() => {}} variant="quiet">Quiet</Link>
          <Link disabled>Disabled</Link>
        </Demo>
      </Section>

      <Section title="Badge">
        <Demo label="subtle" row>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Verified</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Failed</Badge>
          <Badge variant="info">Info</Badge>
        </Demo>
        <Demo label="outline / solid / dot" row>
          <Badge variant="primary" appearance="outline">Outline</Badge>
          <Badge variant="success" appearance="solid">Solid</Badge>
          <Badge variant="success" dot>Live</Badge>
          <Badge variant="error" dot>3 failed</Badge>
          <Badge size="sm">99+</Badge>
        </Demo>
      </Section>

      <Section title="Avatar">
        <Demo label="sizes" row>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
            <Avatar key={s} size={s} name="Priya Nair" />
          ))}
        </Demo>
        <Demo label="image + fallback" row>
          <Avatar uri="https://i.pravatar.cc/128?img=47" name="Jane" />
          <Avatar uri="https://invalid.invalid/x.png" name="Kiran Rao" />
          <Avatar />
        </Demo>
      </Section>

      <Section title="Spinner / Progress / Skeleton">
        <Demo label="spinners" row>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => <Spinner key={s} size={s} />)}
        </Demo>
        <Demo label="progress">
          <View style={{ gap: 12 }}>
            <Progress value={60} />
            <Progress value={80} variant="success" size="sm" />
            <Progress value={40} variant="warning" />
            <Progress accessibilityLabel="Indeterminate" />
          </View>
        </Demo>
        <Demo label="skeleton" row>
          <Skeleton variant="circle" width={48} height={48} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton variant="text" />
            <Skeleton variant="text" width="75%" />
            <Skeleton variant="rect" height={48} />
          </View>
        </Demo>
      </Section>

      <Section title="Icon">
        <Demo label="sizes" row>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
            <Icon key={s} size={s}><Bell /></Icon>
          ))}
        </Demo>
      </Section>
    </ShowcasePage>
  );
}

