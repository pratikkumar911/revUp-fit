import React from 'react';
import { Screen, Header, Card, Muted, Text } from '../../components/ui';
import { LEGAL } from '../../data/legal';

export default function LegalPageScreen({ navigation, route }) {
  const { title } = route.params;
  const page = LEGAL[title];
  return (
    <Screen scroll>
      <Header title={title} onBack={() => navigation.goBack()} />
      {page ? (
        <>
          <Muted>Last updated: {page.updated}</Muted>
          <Card><Muted>{page.intro}</Muted></Card>
          {page.sections.map((section) => (
            <Card key={section.h} style={{ gap: 8 }}>
              <Text style={{ fontWeight: '700', color: '#1B2A22' }}>{section.h}</Text>
              {section.p.map((paragraph, index) => <Muted key={`${section.h}-${index}`}>{paragraph}</Muted>)}
            </Card>
          ))}
        </>
      ) : <Card><Muted>Legal content is not available.</Muted></Card>}
    </Screen>
  );
}
