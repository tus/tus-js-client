# Set up tusd

Start a [tusd](https://github.com/tus/tusd) container and expose its upload creation URL. The container listens on port 8080 and is published on `127.0.0.1`.

The action is self-contained so it can move to its own repository later. Callers pass `endpoint` through as whatever environment variable their tests already use.

## Usage

```yaml
- uses: ./.github/actions/setup-tusd
  id: tusd
  with:
    flags: -verbose
- run: echo "${{ steps.tusd.outputs.endpoint }}"
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `version` | `latest` | `tusproject/tusd` image tag. `latest` tracks the newest stable release. Pin a tag such as `v2.10.1` for a fixed build. |
| `port` | `8080` | Host port mapped to container port 8080. |
| `flags` | empty | Extra tusd arguments, appended after `--hooks-dir /srv/tusd-hooks`. Split on whitespace. Use `flag=value` when a value contains spaces. |

`-host`, `-port`, and `-unix-sock` are rejected, because this action owns the published address. `-base-path` is reflected in the `endpoint` output. The default base path is `/files/`.

## Outputs

| Output | Description |
| --- | --- |
| `endpoint` | Upload creation URL, with a trailing slash. |
| `container` | Docker container name (`tusd`). The container is removed when it stops. |
