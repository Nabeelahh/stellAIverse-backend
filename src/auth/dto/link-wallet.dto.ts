import { IsString, IsEthereumAddress, Length } from "class-validator";

export class LinkWalletDto {
  @IsEthereumAddress()
  walletAddress: string;

  @IsString()
  message: string;

  @IsString()
  @Length(132, 132) // Ethereum signature length
  signature: string;
}
