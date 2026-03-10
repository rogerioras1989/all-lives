import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  blue: "#1e5f7a",
  blueMid: "#2e7fa3",
  green: "#5baa6d",
  gray: "#7a9aaa",
  lightBg: "#f0f7fb",
  LOW: "#5baa6d",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

const RISK_LABELS: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    padding: 0,
  },
  header: {
    backgroundColor: COLORS.blue,
    padding: "24 32 20 32",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
  },
  body: {
    padding: "20 32 32 32",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: `1 solid ${COLORS.lightBg}`,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    borderRadius: 8,
    padding: "12 14",
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
  },
  kpiBadge: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.blue,
    padding: "6 10",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottom: `0.5 solid #e8f0f4`,
  },
  tableRowAlt: {
    backgroundColor: "#f8fbfd",
  },
  tableCell: {
    fontSize: 9,
    color: "#3a5a6a",
  },
  barOuter: {
    height: 6,
    backgroundColor: "#e8f0f4",
    borderRadius: 3,
    flex: 1,
    marginTop: 3,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5 solid #e8f0f4`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray,
  },
});

interface TopicAverage {
  topicId: number;
  topicName: string;
  averageScore: number;
  riskDistribution: Record<string, number>;
}

interface SectorSummary {
  sector: string;
  count: number;
  averageScore: number;
}

interface ReportData {
  campaignTitle: string;
  companyName: string;
  generatedAt: string;
  totalResponses: number;
  overallAverage: number;
  overallRisk: string;
  topicAverages: TopicAverage[];
  sectorSummary: SectorSummary[];
  aiAnalysis?: string;
}

function getRisk(score: number) {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export function DrpsReport({ data }: { data: ReportData }) {
  const overallRisk = getRisk(data.overallAverage);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatório DRPS — NR-01</Text>
          <Text style={styles.headerSub}>
            {data.companyName} · {data.campaignTitle}
          </Text>
          <Text style={[styles.headerSub, { marginTop: 2 }]}>
            Gerado em {data.generatedAt} · All Lives Gestão Ocupacional
          </Text>
        </View>

        <View style={styles.body}>
          {/* KPIs */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Respostas</Text>
              <Text style={styles.kpiValue}>{data.totalResponses}</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Score Geral</Text>
              <Text style={styles.kpiValue}>
                {Math.round(data.overallAverage)}%
              </Text>
              <Text
                style={[
                  styles.kpiBadge,
                  { color: COLORS[overallRisk as keyof typeof COLORS] as string },
                ]}
              >
                {RISK_LABELS[overallRisk]}
              </Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Setores avaliados</Text>
              <Text style={styles.kpiValue}>{data.sectorSummary.length}</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Tópicos</Text>
              <Text style={styles.kpiValue}>{data.topicAverages.length}</Text>
            </View>
          </View>

          {/* Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultado por Tópico</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Tópico</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>
                Score
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>
                Risco
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "center" }]}>
                Baixo
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>
                Moder.
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "center" }]}>
                Alto
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>
                Crít.
              </Text>
            </View>

            {data.topicAverages.map((t, i) => {
              const risk = getRisk(t.averageScore);
              const riskColor = COLORS[risk as keyof typeof COLORS] as string;
              return (
                <View
                  key={t.topicId}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <View style={{ flex: 3 }}>
                    <Text style={styles.tableCell}>{t.topicName}</Text>
                    <View style={styles.barOuter}>
                      <View
                        style={{
                          height: 6,
                          width: `${Math.round(t.averageScore)}%`,
                          backgroundColor: riskColor,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                  <Text
                    style={[styles.tableCell, { flex: 1, textAlign: "center", fontFamily: "Helvetica-Bold" }]}
                  >
                    {Math.round(t.averageScore)}%
                  </Text>
                  <Text
                    style={[styles.tableCell, { flex: 1, textAlign: "center", color: riskColor, fontFamily: "Helvetica-Bold" }]}
                  >
                    {RISK_LABELS[risk]}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6, textAlign: "center", color: COLORS.LOW }]}>
                    {t.riskDistribution.LOW ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: "center", color: COLORS.MEDIUM }]}>
                    {t.riskDistribution.MEDIUM ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6, textAlign: "center", color: COLORS.HIGH }]}>
                    {t.riskDistribution.HIGH ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.7, textAlign: "center", color: COLORS.CRITICAL }]}>
                    {t.riskDistribution.CRITICAL ?? 0}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Sectors */}
          {data.sectorSummary.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resultado por Setor</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Setor</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>
                  Respostas
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "center" }]}>
                  Score Médio
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>
                  Risco
                </Text>
              </View>
              {[...data.sectorSummary]
                .sort((a, b) => b.averageScore - a.averageScore)
                .map((s, i) => {
                  const risk = getRisk(s.averageScore);
                  const riskColor = COLORS[risk as keyof typeof COLORS] as string;
                  return (
                    <View
                      key={s.sector}
                      style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                      <Text style={[styles.tableCell, { flex: 3 }]}>{s.sector}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>
                        {s.count}
                      </Text>
                      <View style={{ flex: 1.5, alignItems: "center" }}>
                        <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                          {Math.round(s.averageScore)}%
                        </Text>
                        <View style={styles.barOuter}>
                          <View
                            style={{
                              height: 6,
                              width: `${Math.round(s.averageScore)}%`,
                              backgroundColor: riskColor,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.tableCell,
                          { flex: 1, textAlign: "center", color: riskColor, fontFamily: "Helvetica-Bold" },
                        ]}
                      >
                        {RISK_LABELS[risk]}
                      </Text>
                    </View>
                  );
                })}
            </View>
          )}

          {/* AI Analysis */}
          {data.aiAnalysis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Análise de IA — Plano de Ação</Text>
              <View
                style={{
                  backgroundColor: "#f0f7fb",
                  borderRadius: 6,
                  padding: "10 12",
                  borderLeft: `3 solid ${COLORS.blueMid}`,
                }}
              >
                <Text style={{ fontSize: 8.5, color: "#3a5a6a", lineHeight: 1.6 }}>
                  {data.aiAnalysis.slice(0, 2000)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            DRPS — All Lives Gestão Ocupacional · Confidencial
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
