namespace KioskRunner.Contracts.Validation;

public static class KioskRunnerErrorCodes
{
    public const string NoConfig = "no_config";
    public const string InvalidJson = "invalid_json";
    public const string RegistryUrlMissing = "registry_url_missing";
    public const string InvalidRegistryUrl = "invalid_registry_url";
    public const string ShowcaseIdMissing = "showcase_id_missing";
    public const string UnsafeListenHost = "unsafe_listen_host";
    public const string DirectoryListingEnabled = "directory_listing_enabled";
    public const string StaticRootEscape = "static_root_escape";
    public const string InvalidPort = "invalid_port";
    public const string InvalidBasePath = "invalid_base_path";
    public const string InvalidChannel = "invalid_channel";
    public const string InvalidRetention = "invalid_retention";
    public const string InvalidCheckInterval = "invalid_check_interval";
    public const string WebServerMissing = "web_server_missing";

    public const string ManifestRequiredFieldMissing = "manifest_required_field_missing";
    public const string ManifestShowcaseIdMismatch = "manifest_showcase_id_mismatch";
    public const string ManifestChannelMismatch = "manifest_channel_mismatch";
    public const string ManifestStatusNotProduction = "manifest_status_not_production";
    public const string BundleUrlInvalid = "bundle_url_invalid";
    public const string Sha256Invalid = "sha256_invalid";
    public const string MinRunnerVersionInvalid = "min_runner_version_invalid";
    public const string RunnerUpdateRequired = "runner_update_required";
    public const string BridgeContractIncompatible = "bridge_contract_incompatible";
    public const string PublishedAtInvalid = "published_at_invalid";
    public const string ManifestUnavailable = "manifest_unavailable";
    public const string ManifestResponseNotJson = "manifest_response_not_json";
    public const string InvalidManifestJson = "invalid_manifest_json";
    public const string BundleDownloadFailed = "bundle_download_failed";
    public const string HashFileMissing = "hash_file_missing";
    public const string Sha256Mismatch = "sha256_mismatch";
    public const string BrokenZip = "broken_zip";
    public const string ZipSlipBlocked = "zip_slip_blocked";
    public const string BundleIndexMissing = "bundle_index_missing";
    public const string BundleForbiddenFile = "bundle_forbidden_file";
    public const string BundleAssetsMissing = "bundle_assets_missing";
    public const string VersionPublishFailed = "version_publish_failed";
    public const string CurrentSwitchFailed = "current_switch_failed";
    public const string StateReadFailed = "state_read_failed";
    public const string StateWriteFailed = "state_write_failed";
    public const string WebServerFailed = "web_server_failed";
    public const string PortInUse = "port_in_use";
    public const string RollbackPreviousMissing = "rollback_previous_missing";
    public const string RollbackPreviousInvalid = "rollback_previous_invalid";
    public const string RecoveryCleanupFailed = "recovery_cleanup_failed";

    public const string InvalidUpdateStatus = "invalid_update_status";
    public const string InvalidWebServerStatus = "invalid_web_server_status";
    public const string InvalidHealth = "invalid_health";
    public const string InvalidState = "invalid_state";
}
