{{/*
Expand the name of the chart.
*/}}
{{- define "doc-gen-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "doc-gen-service.fullname" -}}
{{- $componentName := include "doc-gen-service.name" .  }}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $componentName | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "doc-gen-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "doc-gen-service.labels" -}}
helm.sh/chart: {{ include "doc-gen-service.chart" . }}
{{ include "doc-gen-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/image-version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/short-name: {{ include "doc-gen-service.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "doc-gen-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "doc-gen-service.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


