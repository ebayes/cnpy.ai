import React from 'react'
import { Text, Badge, Group, Rating } from '@mantine/core';


function DrawerContent() {
  return (
    <div>
        <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Name:</Text>
            <Text fz="sm" variant="light" style={{ marginLeft: '10px' }}>
              Custom
            </Text>
          </Group>
          <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Model:</Text>
            <Badge color="pink" variant="light" style={{ marginLeft: '10px' }}>
              OpenAI Clip
            </Badge>
          </Group>
          <Group position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Speed:</Text>
            <Rating value={5} readOnly />
          </Group> 
          <Group position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Accuracy:</Text>
            <Rating value={4} readOnly />
          </Group> 
    </div>
  )
}

export default DrawerContent