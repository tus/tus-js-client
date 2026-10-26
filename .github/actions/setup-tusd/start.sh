#!/usr/bin/env bash
# Start tusd and publish its upload creation URL for later workflow steps.

set -euo pipefail

version="${TUSD_VERSION:-latest}"
port="${TUSD_PORT:-8080}"
flags="${TUSD_FLAGS:-}"

if [[ ! "${version}" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "version must be a Docker image tag" >&2
  exit 1
fi

if [[ ! "${port}" =~ ^[0-9]+$ ]] || ((port < 1 || port > 65535)); then
  echo "port must be an integer from 1 to 65535" >&2
  exit 1
fi

base_path="/files/"
tusd_args=(--hooks-dir /srv/tusd-hooks)

if [[ -n "${flags}" ]]; then
  extra=()
  # Word-split only. Values that contain whitespace belong in flag=value form.
  read -r -a extra <<< "${flags}"
  tusd_args+=("${extra[@]}")
fi

is_bind_flag() {
  case "${1%%=*}" in
    -host | --host | -port | --port | -unix-sock | --unix-sock) return 0 ;;
    *) return 1 ;;
  esac
}

for ((i = 0; i < ${#tusd_args[@]}; i++)); do
  arg="${tusd_args[$i]}"
  if is_bind_flag "${arg}"; then
    echo "set the published port with the port input; ${arg%%=*} is not accepted in flags" >&2
    exit 1
  fi
  case "${arg}" in
    -base-path | --base-path)
      if ((i + 1 >= ${#tusd_args[@]})); then
        echo "tusd -base-path requires a value" >&2
        exit 1
      fi
      base_path="${tusd_args[$((i + 1))]}"
      ;;
    -base-path=* | --base-path=*)
      base_path="${arg#*=}"
      ;;
  esac
done

if [[ "${base_path}" != /* ]]; then
  base_path="/${base_path}"
fi
if [[ "${base_path}" != */ ]]; then
  base_path="${base_path}/"
fi

endpoint="http://127.0.0.1:${port}${base_path}"
container="tusd"

docker rm -f "${container}" >/dev/null 2>&1 || true
docker run -d --name "${container}" --rm \
  -p "127.0.0.1:${port}:8080" \
  "tusproject/tusd:${version}" \
  "${tusd_args[@]}"

ready=0
for _attempt in $(seq 1 30); do
  if curl -fsS -o /dev/null -X OPTIONS -H 'Tus-Resumable: 1.0.0' "${endpoint}" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  docker logs "${container}" >&2 || true
  echo "tusd did not become ready at ${endpoint}" >&2
  exit 1
fi

if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
  echo "GITHUB_OUTPUT is not set" >&2
  exit 1
fi

{
  echo "endpoint=${endpoint}"
  echo "container=${container}"
} >> "${GITHUB_OUTPUT}"

echo "tusd is ready at ${endpoint}"
