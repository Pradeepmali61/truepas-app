import { useState } from "react";
import { Text, View } from "react-native";
import { useThemeTokens } from "@/theme";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/composite/Card";
import { Tabs } from "@/components/composite/Tabs";
import { Accordion } from "@/components/composite/Accordion";
import { Pagination } from "@/components/composite/Pagination";
import { DataList, type ListItem } from "@/components/complex/DataList";
import { SearchAndFilterBar } from "@/components/complex/SearchAndFilterBar";
import { Button } from "@/components/ui/Button";
import { Demo, ShowcasePage, Section } from "../demos";

const STATUS: Record<string, React.ReactNode> = {
  verified: <Badge variant="success" dot>Verified</Badge>,
  pending: <Badge variant="warning" dot>Pending</Badge>,
  failed: <Badge variant="error" dot>Failed</Badge>,
};

const ROWS: ListItem[] = [
  { key: "BK-1042", title: "BK-1042 Â· Priya Nair", subtitle: "Koramangala Kiosk 4 Â· Sep 10", trailing: STATUS.verified, onPress: () => {} },
  { key: "BK-1043", title: "BK-1043 Â· Ravi Shankar", subtitle: "Indiranagar Gate B Â· Sep 11", trailing: STATUS.pending, onPress: () => {} },
  { key: "BK-1044", title: "BK-1044 Â· Aisha Khan", subtitle: "HSR Layout Â· Sep 11", trailing: STATUS.failed, onPress: () => {} },
];

export function DataSection() {
  const theme = useThemeTokens();
  const [page, setPage] = useState(2);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  return (
    <ShowcasePage>
      <Section title="Card">
        <View style={{ gap: 12 }}>
          <Card appearance="outlined">
            <CardHeader>
              <CardTitle>Identity wallet</CardTitle>
              <CardDescription>2 documents Â· face enrolled</CardDescription>
            </CardHeader>
            <CardContent>
              <Text style={{ fontFamily: theme.fontFamily.sans.regular, fontSize: 14 }}>Passport and Aadhaar verified.</Text>
            </CardContent>
            <CardFooter>
              <Button size="sm">Manage</Button>
              <Button size="sm" variant="ghost">Add document</Button>
            </CardFooter>
          </Card>
          <Card appearance="elevated" onPress={() => {}}>
            <CardContent>
              <Text>Pressable elevated card â†’</Text>
            </CardContent>
          </Card>
        </View>
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            { value: "upcoming", label: "Upcoming", badge: <Badge size="sm" variant="primary">3</Badge>, content: <Text>Upcoming bookings.</Text> },
            { value: "past", label: "Past", content: <Text>Past bookings.</Text> },
            { value: "cancelled", label: "Cancelled", disabled: true, content: null },
          ]}
        />
        <Tabs
          variant="pills"
          items={[
            { value: "day", label: "Day", content: <Text>Day view.</Text> },
            { value: "week", label: "Week", content: <Text>Week view.</Text> },
          ]}
        />
      </Section>

      <Section title="Accordion">
        <Accordion
          items={[
            { value: "a", title: "How does face check-in work?", content: <Text>Enroll once, then any Truepas kiosk verifies you in ~2 seconds.</Text> },
            { value: "b", title: "Is my biometric data shared?", content: <Text>No â€” embeddings stay local; only match results are exchanged.</Text> },
            { value: "c", title: "Disabled", content: null, disabled: true },
          ]}
        />
      </Section>

      <Section title="DataList (mobile DataTable)">
        <Demo label="populated">
          <DataList items={ROWS} />
        </Demo>
        <Demo label="loading / empty / error">
          <DataList items={[]} status="loading" loadingSkeletonCount={2} />
          <DataList items={[]} />
          <DataList items={[]} status="error" onRetry={() => {}} />
        </Demo>
      </Section>

      <Section title="SearchAndFilterBar">
        <SearchAndFilterBar
          search={search}
          onSearchChange={setSearch}
          filters={[
            { key: "status", label: "Status", options: [
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
            ]},
            { key: "site", label: "Site", options: [
              { value: "koramangala", label: "Koramangala" },
              { value: "indiranagar", label: "Indiranagar" },
            ]},
          ]}
          values={filters}
          onFilterChange={(k, v) => setFilters((s) => ({ ...s, [k]: v }))}
          onClearAll={() => setFilters({})}
        />
      </Section>

      <Section title="Pagination">
        <Pagination page={page} totalPages={8} onPageChange={setPage} summary={`Page ${page} of 8`} />
      </Section>
    </ShowcasePage>
  );
}

