# Replace Token v1

[![Run Tests](https://github.com/alexander-trishin/replace-token/actions/workflows/run-tests.yml/badge.svg)](https://github.com/alexander-trishin/replace-token/actions/workflows/run-tests.yml)
[![Check dist/](https://github.com/alexander-trishin/replace-token/actions/workflows/check-dist.yml/badge.svg)](https://github.com/alexander-trishin/replace-token/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/alexander-trishin/replace-token/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/alexander-trishin/replace-token/actions/workflows/codeql-analysis.yml)
[![Coverage](./.github/badges/coverage.svg)](./.github/badges/coverage.svg)

This action replaces tokens in files with variable values.

The first version was intended for use mainly in internal projects. But there are plans to expand the functionality.

## What's new

Please refer to the [release page](https://github.com/alexander-trishin/replace-token/releases/latest) for the latest
release notes.

## Usage

<!-- start usage -->

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    # A multiline list of files to replace tokens in.
    #
    # Each line supports glob pattern.
    # [Learn more about glob patterns](https://github.com/actions/toolkit/tree/main/packages/glob#patterns)
    #
    # Required.
    target:

    # The encoding to read and write all files.
    #
    # Accepted values:
    #   - auto: detect encoding using chardet
    #   - ascii
    #   - utf-8
    #   - utf-16le
    #
    # Optional. Default: "auto"
    encoding:

    # Indicates whether to follow symbolic links while searching for target file(s).
    #
    # Optional. Default: true
    follow-symbolic-links:

    # The token prefix for using custom token pattern.
    #
    # Optional: Default: "${{"
    token-prefix:

    # The token suffix for using custom token pattern.
    #
    # Optional. Default: "}}"
    token-suffix:

    # A YAML formatted multiline string containing variable values (keys are case-insensitive).
    #
    # May override values from `variables-json` and `variables-secret-json` if keys match.
    #
    # Example: >
    #   - VARIABLE0: VALUE0
    #   - VARIABLE1: ${{ vars.VALUE1 }}
    #
    # Optional. Default: ""
    variables:

    # A JSON formatted multiline string containing additional variable values (keys are case-insensitive).
    #
    # Values may be overwritten by `variables-secret-json` and `variables' if keys match.
    #
    # Optional. Default: ""
    variables-json:

    # A JSON formatted multiline string containing additional variable values (keys are case-insensitive, all values are masked).
    #
    # Values may override `variables-json` and be overwritten by `variables' if keys match.
    #
    # Optional. Default: ""
    variables-secret-json:
```

<!-- end usage -->

## Scenarios

- [Single file](#single-file)
- [Single file with a specific encoding](#single-file-with-a-specific-encoding)
- [Multiple files](#multiple-files)
- [Multiple files (glob)](#multiple-files-glob)
- [Multiple files (ignore symlinks)](#multiple-files-ignore-symlinks)
- [With custom token pattern](#with-custom-token-pattern)
- [With `vars` context](#with-vars-context)
- [With `secrets` context](#with-secrets-context)

### Single file

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./templates/example.txt
    variables: >
      - TOKEN: value
```

### Single file with a specific encoding

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./templates/example.txt
    encoding: utf-8
    variables: >
      - TOKEN: value
```

### Multiple files

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: |
      ./templates/example-0.txt 
      ./templates/example-1.txt
    variables: >
      - TOKEN: value
```

### Multiple files (glob)

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./templates/*
    variables: >
      - TOKEN: value
```

### Multiple files (ignore symlinks)

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./templates/examples/*.txt
    follow-symbolic-links: false
    variables: >
      - TOKEN: value
```

### With custom token pattern

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./example.txt
    token-prefix: "#"
    token-suffix: "%"
    variables: >
      - TOKEN: value
```

### With `vars` context

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./example.txt
    variables-json: ${{ toJson(vars) }}
```

### With `secrets` context

```yaml
- uses: alexander-trishin/replace-token@v1
  with:
    target: ./example.txt
    variables-secret-json: ${{ toJson(secrets) }}
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
