import { useEffect, useState } from 'react';
import {
  Container,
  Text,
  Title,
  Group,
  Loader,
} from '@mantine/core';
import { getProfile } from '../../utils/api/user';
import { PlayerSection } from '../../components/Profile/PlayerSection';
import { UserProps, UserSection } from '../../components/Profile/UserSection';
import { UserBindSection } from '../../components/Profile/UserBindSection';
import classes from "../Page.module.css";

export default function Profile() {
  const [user, setUser] = useState<UserProps | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getProfileHandler = async () => {
    try {
      const res = await getProfile();
      const data = await res.json();
      if (data.code === 200) {
        setUser(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoaded(true);
    }
  }

  useEffect(() => {
    document.title = "账号详情 | maimai DX 查分器";

    getProfileHandler();
  }, []);

  return (
    <Container className={classes.root} size={400}>
      <Title order={2} size="h2" fw={900} ta="center" mt="xs">
        账号详情
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt="sm" mb="xl">
        查看你的 maimai DX 查分器账号详情与游戏数据
      </Text>
        {!isLoaded ? (
          <Group justify="center" mt="xl">
            <Loader />
          </Group>
        ) : (
          <>
            <PlayerSection />
            <UserSection user={user} />
            <UserBindSection userBind={user && user.bind} />
          </>
        )}
    </Container>
  );
}
