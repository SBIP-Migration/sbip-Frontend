import React from 'react'
import { Button, Flex, Heading, Text, VStack } from '@chakra-ui/react'

export default function Step3(props) {
  return (
    <div className={'stepBlock' + (props.selected ? ' selected' : '')}>
      <Text className='pixel_font'  style={{ fontSize: 20 }}  textAlign="center"> <b>Approve All Debt Positions</b></Text>
    </div>
  )
}
