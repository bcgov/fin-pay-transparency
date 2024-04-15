{{/*
Expand the name of the chart.
*/}}
{{- define "maintenance.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "maintenance.fullname" -}}
{{- $componentName := include "maintenance.name" .  }}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $componentName | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "maintenance.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "maintenance.labels" -}}
helm.sh/chart: {{ include "maintenance.chart" . }}
{{ include "maintenance.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/image-version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/short-name: {{ include "maintenance.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "maintenance.selectorLabels" -}}
app.kubernetes.io/name: {{ include "maintenance.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


