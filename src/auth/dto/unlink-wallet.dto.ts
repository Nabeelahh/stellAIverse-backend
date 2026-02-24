import { IsEthereumAddress } from "class-validator";

export class UnlinkWalletDto {
  @IsEthereumAddress()
  walletAddress: string;
}
