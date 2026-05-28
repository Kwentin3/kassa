using KioskRunner.Host.Cli;

return await CliApplication.RunAsync(args, Console.Out, Console.Error, CancellationToken.None);
