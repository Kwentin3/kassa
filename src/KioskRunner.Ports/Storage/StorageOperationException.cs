namespace KioskRunner.Ports.Storage;

public sealed class StorageOperationException : Exception
{
    public StorageOperationException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
