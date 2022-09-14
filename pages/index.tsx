import React from "react";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import contractInterface from "../contract-abi.json";
import FlipCard, { BackCard, FrontCard } from "../components/FlipCard";
import { parseEther } from "ethers/lib/utils";

// Goerli address no block restrictions: 0x4715Ed62ECAaA8e9B7fc97bcd0774Acc1166F2a2
// Goerli address with block restrictions: 0x3d24b636544cF78A5f638264e835315722Cc9f3e
// Mainnet: 0xEffB24c14c9e2c643d44bee0D334F3cFC147C895
// Magic block: 15537310
const contractConfig = {
  addressOrName: "0xEffB24c14c9e2c643d44bee0D334F3cFC147C895",
  contractInterface: contractInterface,
};

const Home: NextPage = () => {
  const [totalMinted, setTotalMinted] = React.useState(0);
  const [amount, setAmount] = React.useState("0.05");
  const { isConnected } = useAccount();

  // handle amount
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // handle error when leaving an empty input or entering a non-nuamber value or lower than 0.05
    if (
      e.target.value === "" || isNaN(Number(e.target.value)) ||
      Number(e.target.value) < 0.05
    ) {
      setAmount("0.05");
      return;
    } else {
      setAmount(e.target.value);
    }
    // setAmount(e.target.value);
  };

  const { config: contractWriteConfig } = usePrepareContractWrite({
    ...contractConfig,
    functionName: "mint",
    args: [{ value: parseEther(amount) }],
  });

  const {
    data: mintData,
    write: mint,
    isLoading: isMintLoading,
    isSuccess: isMintStarted,
    error: mintError,
  } = useContractWrite(contractWriteConfig);

  const { data: totalSupplyData } = useContractRead({
    ...contractConfig,
    functionName: "totalSupply",
    watch: true,
  });

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  React.useEffect(() => {
    if (totalSupplyData) {
      setTotalMinted(totalSupplyData.toNumber());
    }
  }, [totalSupplyData]);

  const isMinted = txSuccess;

  return (
    <div className="page">
      <div className="container">
        <div style={{ flex: "1 1 auto" }}>
          <div style={{ padding: "24px 24px 24px 0" }}>
            <h1>Merge Day NFT</h1>
            <p style={{ margin: "12px 0 24px" }}>
              {totalMinted} minted so far!
            </p>
            <ConnectButton />

            {mintError && (
              <p style={{ marginTop: 24, color: "#FF6257" }}>
                Error: {mintError.message}
              </p>
            )}
            {txError && (
              <p style={{ marginTop: 24, color: "#FF6257" }}>
                Error: {txError.message}
              </p>
            )}

            {isConnected && !isMinted && (
              <div style={{ alignItems: "center" }}>
                <input
                  style={{
                    width: "70%",
                    padding: 7,
                    marginBottom: 5,
                    marginTop: 5,
                    marginRight: 5,
                    borderRadius: 10,
                  }}
                  aria-label="Amount (ether)"
                  onChange={handleAmountChange}
                  placeholder="Pay 0.05 or more"
                  value={amount}
                />
                <button
                  style={{ marginTop: 24 }}
                  disabled={!mint || isMintLoading || isMintStarted}
                  className="button"
                  data-mint-loading={isMintLoading}
                  data-mint-started={isMintStarted}
                  onClick={() => mint?.()}
                >
                  {isMintLoading && "Waiting for approval"}
                  {isMintStarted && "Minting..."}
                  {!isMintLoading && !isMintStarted && "Mint"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: "0 0 auto" }}>
          <FlipCard>
            <FrontCard isCardFlipped={isMinted}>
              <Image
                layout="responsive"
                src="/nft.png"
                width="512"
                height="512"
                alt="Merge Day NFT"
              />
              <h1 style={{ marginTop: 24 }}>Merge Day NFT</h1>
              <ConnectButton />
            </FrontCard>
            <BackCard isCardFlipped={isMinted}>
              <div style={{ padding: 24 }}>
                <Image
                  src="/nft.png"
                  width="80"
                  height="80"
                  alt="RainbowKit Demo NFT"
                  style={{ borderRadius: 8 }}
                />
                <h2 style={{ marginTop: 24, marginBottom: 6 }}>NFT Minted!</h2>
                <p style={{ marginBottom: 24 }}>
                  Your NFT will show up in your wallet in the next few minutes.
                </p>
                <p style={{ marginBottom: 6 }}>
                  View on{" "}
                  <a href={`https://etherscan.io/tx/${mintData?.hash}`}>
                    Etherscan
                  </a>
                </p>
                <p>
                  View on{" "}
                  <a
                    href={`https://opensea.io/assets/${txData?.to}/1`}
                  >
                    Opensea
                  </a>
                </p>
              </div>
            </BackCard>
          </FlipCard>
        </div>
      </div>
    </div>
  );
};

export default Home;
