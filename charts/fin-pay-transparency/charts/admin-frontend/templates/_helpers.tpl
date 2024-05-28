{{/*
Expand the name of the chart.
*/}}
{{- define "admin-frontend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "admin-frontend.fullname" -}}
{{- $componentName := include "admin-frontend.name" .  }}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $componentName | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "admin-frontend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "admin-frontend.labels" -}}
helm.sh/chart: {{ include "admin-frontend.chart" . }}
{{ include "admin-frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/short-name: {{ include "admin-frontend.name" . }}
{{- end }}
app.kubernetes.io/image-version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "admin-frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "admin-frontend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

