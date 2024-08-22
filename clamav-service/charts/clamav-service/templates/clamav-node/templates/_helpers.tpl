{{/*
Expand the name of the chart.
*/}}
{{- define "clamav-node.name" -}}
{{- default .Chart.Name .Values.node.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "clamav-node.fullname" -}}
{{- $componentName := include "clamav-node.name" .  }}
{{- if .Values.node.fullnameOverride }}
{{- .Values.node.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $componentName | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "clamav-node.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "clamav-node.labels" -}}
helm.sh/chart: {{ include "clamav-node.chart" . }}
{{ include "clamav-node.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/short-name: {{ include "clamav-node.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "clamav-node.selectorLabels" -}}
app.kubernetes.io/name: {{ include "clamav-node.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


