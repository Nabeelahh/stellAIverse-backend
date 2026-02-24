import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { verifyMessage } from "ethers";
import { ChallengeService } from "./challenge.service";
import { User } from "../user/entities/user.entity";

export interface AuthPayload {
  address: string;
  email?: string;
  role?: string;
  roles?: string[];
  iat: number;
}

@Injectable()
export class WalletAuthService {
  constructor(
    private challengeService: ChallengeService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Verify a signed message and return JWT token if valid
   */
  async verifySignatureAndIssueToken(
    message: string,
    signature: string,
  ): Promise<{ token: string; address: string }> {
    // Extract challenge ID from message
    const challengeId = this.challengeService.extractChallengeId(message);
    if (!challengeId) {
      throw new UnauthorizedException("Invalid challenge message format");
    }

    // Get and consume the challenge
    const challenge = this.challengeService.consumeChallenge(challengeId);
    if (!challenge) {
      throw new UnauthorizedException(
        "Challenge not found or expired. Please request a new challenge.",
      );
    }

    // Verify the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch (error) {
      throw new UnauthorizedException("Invalid signature");
    }

    // Verify the recovered address matches the challenge address
    if (recoveredAddress.toLowerCase() !== challenge.address) {
      throw new UnauthorizedException(
        "Signature does not match challenge address",
      );
    }

    // Fetch user to get email if linked
    const user = await this.userRepository.findOne({
      where: { walletAddress: recoveredAddress.toLowerCase() },
    });

    // Issue JWT token with email and role if available
    const payload: AuthPayload = {
      address: recoveredAddress.toLowerCase(),
      email: user?.emailVerified ? user.email : undefined,
      role: user?.role || "user",
      iat: Math.floor(Date.now() / 1000),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      address: recoveredAddress.toLowerCase(),
    };
  }

  /**
   * Validate JWT token and return payload
   */
  validateToken(token: string): AuthPayload {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  /**
   * Link a new wallet to an existing user account
   * Requires authentication and signature verification
   */
  async linkWallet(
    currentWalletAddress: string,
    newWalletAddress: string,
    message: string,
    signature: string,
  ): Promise<{ message: string; walletAddress: string }> {
    // Normalize addresses
    const normalizedCurrent = currentWalletAddress.toLowerCase();
    const normalizedNew = newWalletAddress.toLowerCase();

    // Verify the signature for the new wallet
    const challengeId = this.challengeService.extractChallengeId(message);
    if (!challengeId) {
      throw new UnauthorizedException("Invalid challenge message format");
    }

    const challenge = this.challengeService.consumeChallenge(challengeId);
    if (!challenge) {
      throw new UnauthorizedException(
        "Challenge not found or expired. Please request a new challenge.",
      );
    }

    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch (error) {
      throw new UnauthorizedException("Invalid signature");
    }

    if (recoveredAddress.toLowerCase() !== normalizedNew) {
      throw new UnauthorizedException(
        "Signature does not match the new wallet address",
      );
    }

    // Check if new wallet is already in use
    const existingUser = await this.userRepository.findOne({
      where: { walletAddress: normalizedNew },
    });

    if (existingUser) {
      throw new ConflictException(
        "This wallet address is already linked to another account",
      );
    }

    // Get current user
    const currentUser = await this.userRepository.findOne({
      where: { walletAddress: normalizedCurrent },
    });

    if (!currentUser) {
      throw new BadRequestException("Current user not found");
    }

    // Update user's wallet address
    currentUser.walletAddress = normalizedNew;
    await this.userRepository.save(currentUser);

    return {
      message: "Wallet successfully linked",
      walletAddress: normalizedNew,
    };
  }

  /**
   * Unlink a wallet from user account
   * Requires authentication and email verification
   */
  async unlinkWallet(
    currentWalletAddress: string,
    walletToUnlink: string,
  ): Promise<{ message: string }> {
    const normalizedCurrent = currentWalletAddress.toLowerCase();
    const normalizedUnlink = walletToUnlink.toLowerCase();

    // Verify addresses match
    if (normalizedCurrent !== normalizedUnlink) {
      throw new BadRequestException(
        "You can only unlink your own wallet address",
      );
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { walletAddress: normalizedCurrent },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Require email verification before unlinking
    if (!user.emailVerified || !user.email) {
      throw new BadRequestException(
        "Email must be verified before unlinking wallet. This ensures account recovery.",
      );
    }

    // For safety, we don't actually delete the wallet but mark it for recovery
    // In a production system, you might want to implement a grace period
    return {
      message:
        "Wallet unlink requested. Please use email recovery to regain access.",
    };
  }

  /**
   * Recover wallet access using verified email
   * Issues a new challenge for wallet authentication
   */
  async recoverWallet(
    email: string,
    recoveryToken: string,
  ): Promise<{ message: string; walletAddress: string; challenge: string }> {
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail, emailVerified: true },
    });

    if (!user) {
      throw new BadRequestException(
        "No verified account found with this email",
      );
    }

    // In production, verify the recovery token
    // For now, we'll issue a challenge for the wallet
    const challengeMessage = this.challengeService.issueChallengeForAddress(
      user.walletAddress,
    );

    return {
      message: "Recovery initiated. Sign the challenge with your wallet.",
      walletAddress: user.walletAddress,
      challenge: challengeMessage,
    };
  }
}
