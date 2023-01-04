import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { init, useConnectWallet } from '@web3-onboard/react'

import Balances, { WrapperTokenType } from '../components/Balances'
import {
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { getWeb3Provider } from '../utils/ethers'
import {
  getATokenBalances,
  getStableDebtBalances,
  getVariableDebtBalances,
} from '../utils/balances'
import { ethers } from 'ethers'
import StepProgress from '../components/stepprogress/stepProgress'
import DebtBalances from '../components/DebtBalances'
import Dashboard from '../components/Dashboard'

export enum StepEnum {
  APPROVE_A_TOKENS = 1,
  APPROVE_DEBT_POSITIONS = 2,
  TRANSFER_TOKENS = 3,
  COMPLETE = 4,
}

export default function Home() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currentStep, updateCurrentStep] = useState<StepEnum>(
    StepEnum.APPROVE_A_TOKENS
  )

  const walletSigner = wallet?.accounts?.[0].address

  const [provider, setProvider] = useState<ethers.providers.Provider>()
  const [aTokenBalances, setATokenBalances] = useState<WrapperTokenType[]>([])
  const [stableDebtBalances, setStableDebtBalances] = useState<
    WrapperTokenType[]
  >([])
  const [variableDebtBalances, setVariableDebtBalances] = useState<
    WrapperTokenType[]
  >([])

  const getAllBalances = useCallback(
    async (address: string) => {
      if (!provider) return
      const [
        aTokenBalancesPromise,
        stableDebtBalancesPromise,
        variableDebtBalancesPromise,
      ] = await Promise.allSettled([
        getATokenBalances(provider, address),
        getStableDebtBalances(provider, address),
        getVariableDebtBalances(provider, address),
      ])

      if (aTokenBalancesPromise.status === 'fulfilled') {
        setATokenBalances(aTokenBalancesPromise.value)
      }

      if (stableDebtBalancesPromise.status === 'fulfilled') {
        setStableDebtBalances(stableDebtBalancesPromise.value)
      }

      if (variableDebtBalancesPromise.status === 'fulfilled') {
        setVariableDebtBalances(variableDebtBalancesPromise.value)
      }
    },
    [provider]
  )

  const onRefreshTokenBalances = async () => {
    await getAllBalances(walletSigner)
  }

  const onDisconnectWallet = useCallback(() => {
    disconnect(wallet)
  }, [disconnect, wallet])

  const onConnectRecipientWallet = useCallback(() => {
    connect()
    onClose()
  }, [connect, onClose])

  // Call this function, when we want to switch wallets
  const onSwitchWallet = useCallback(() => {
    onOpen()
  }, [onOpen])

  useEffect(() => {
    if (!wallet) return
    setProvider(getWeb3Provider(wallet))
  }, [wallet])

  useEffect(() => {
    ;(async () => {
      if (walletSigner?.length && provider != null) {
        await getAllBalances(walletSigner)
      }
    })()
  }, [walletSigner, getAllBalances, provider])

  return (
    <Flex flexDir="column">
      <div className={styles.container}>
        <Head>
          <title>OmniTransfer</title>
          <meta
            name="description"
            content="Migrate your Aave positions to another wallet"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Flex
          flexDir="column"
          justifyContent="center"
          alignItems="center"
          height="100%"
          mt="72px"
        >
          <Heading as="h1" size="lg" textAlign="center" mb="4">
            OmniTransfer - Transfer all your tokens & positions in one click
          </Heading>
          {!wallet && (
            <Flex height="100%">
              <Button
                disabled={connecting}
                onClick={() => (wallet ? disconnect(wallet) : connect())}
              >
                {connecting ? 'Connecting' : 'Connect'}
              </Button>
            </Flex>
          )}
          {wallet && (
            <VStack>
              <Text size="md">Address connected: {walletSigner} </Text>
              <StepProgress
                {...{
                  currentStep,
                  updateStep: updateCurrentStep,
                }}
              />
              <Dashboard
                {...{
                  currentStep,
                  nextStep: () => updateCurrentStep(currentStep + 1),
                  refreshTokenBalances: onRefreshTokenBalances,
                  aTokenBalances,
                  stableDebtBalances,
                  variableDebtBalances,
                }}
              />
            </VStack>
          )}
          <Modal
            isOpen={isOpen}
            onClose={onClose}
            closeOnEsc={false}
            closeOnOverlayClick={false}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Switch Wallet</ModalHeader>
              <ModalBody>
                <Text textAlign="center">
                  Disconnect current wallet, and connect the recipient wallet to
                  approve the credit delegation for the incoming debt tokens
                </Text>
              </ModalBody>
              <ModalFooter>
                {wallet ? (
                  <Button colorScheme="blue" onClick={onDisconnectWallet}>
                    Disconnect Wallet
                  </Button>
                ) : (
                  <Button colorScheme="blue" onClick={onConnectRecipientWallet}>
                    Connect Recipient Wallet
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Flex>
      </div>
    </Flex>
  )
}
