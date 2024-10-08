import { useEffect, useState } from 'react';
import {
  Button,
  Card, Checkbox,
  Flex,
  Group, Loader,
  Pagination,
  Space,
  Text,
} from '@mantine/core';
import { useLocalStorage, useToggle } from "@mantine/hooks";
import { getAliasList, getUserVotes } from "../../utils/api/alias.tsx";
import { AliasList } from "../../components/Alias/AliasList.tsx";
import { CreateAliasModal } from "../../components/Alias/CreateAliasModal.tsx";
import {
  IconArrowDown,
  IconArrowUp,
  IconDatabaseOff,
  IconPlus,
} from "@tabler/icons-react";
import classes from "../Page.module.css"
import { openRetryModal } from "../../utils/modal.tsx";
import { SongCombobox } from "../../components/SongCombobox.tsx";
import { Page } from "@/components/Page/Page.tsx";

export interface AliasProps {
  alias_id: number;
  song: {
    id: number;
    name: string;
  };
  song_type: string;
  difficulty: number;
  alias: string;
  approved: boolean;
  weight: {
    up: number;
    down: number;
    total: number;
  };
  uploader: {
    id: number;
    name: string;
  };
  upload_time: string;
  // extra
  vote?: VoteProps;
}

interface VoteProps {
  alias_id?: number;
  vote_id?: number;
  weight: number;
}

const sortKeys = [
  { name: '别名', key: 'alias' },
  { name: '总权重', key: 'total_weight' },
  { name: '提交时间', key: 'alias_id' },
];

const AliasVoteContent = () => {
  const [game] = useLocalStorage<"maimai" | "chunithm">({ key: 'game' });
  const [aliases, setAliases] = useState<AliasProps[]>([]);
  const [votes, setVotes] = useState<VoteProps[]>([]);
  const [opened, setOpened] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [onlyNotApproved, toggleOnlyNotApproved] = useToggle();

  // 排序相关
  const [sortBy, setSortBy] = useState();
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // 筛选相关
  const [songId, setSongId] = useState<number>(0);

  // 分页相关
  // const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const sort = (key: any, autoChangeReverse = true) => {
    let reversed = reverseSortDirection;
    if (autoChangeReverse) {
      reversed = key === sortBy ? !reverseSortDirection : false;
      setReverseSortDirection(reversed);
    }
    setSortBy(key);
    setPage(1);
  };

  const getUserVotesHandler = async () => {
    if (!game) return;
    try {
      const res = await getUserVotes(game);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      setVotes(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getAliasListHandler = async (page: number, songId?: number) => {
    if (!game) return;
    setFetching(true);
    try {
      const res = await getAliasList(game, page, onlyNotApproved, sortBy, reverseSortDirection ? 'asc' : 'desc', songId);
      const data = await res.json();
      if (!data.success || !data.data || !data.data.aliases) {
        setFetching(false);
        setTotalPages(0);
        setAliases([]);
        if (data.message) {
          throw new Error(data.message);
        }
        return;
      }
      setTotalPages(data.data.page_count);
      setAliases(data.data.aliases);
    } catch (error) {
      openRetryModal("曲目别名获取失败", `${error}`, () => {
        getAliasListHandler(page, songId);
      });
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!game) return;

    setFetching(true);
    setSongId(0);
    setPage(1);
    getUserVotesHandler().then(() => {
      getAliasListHandler(1);
    });
  }, [game]);

  useEffect(() => {
    getAliasListHandler(page, songId);
  }, [onlyNotApproved, page, songId, sortBy, reverseSortDirection]);

  useEffect(() => {
    aliases.forEach((alias, i) => {
      const vote = votes.find((vote) => vote.alias_id === alias.alias_id);
      if (vote) alias.vote = vote;
      aliases[i] = alias;
    });

    setAliases(aliases);
  }, [aliases]);

  const renderSortIndicator = (key: any) => {
    if (sortBy === key) {
      return <>
        {reverseSortDirection ? <IconArrowUp size={20} /> : <IconArrowDown size={20} />}
      </>
    }
    return null;
  };

  return (
    <div>
      <CreateAliasModal opened={opened} onClose={(alias) => {
        if (alias) getAliasListHandler(page, songId);
        setOpened(false);
      }} />
      <Card withBorder radius="md" className={classes.card} p={0}>
        <Group m="md" justify="space-between">
          <div>
            <Text fz="lg" fw={700}>
              排序方式
            </Text>
            <Text fz="xs" c="dimmed" mt={3}>
              选择曲目别名的排序方式
            </Text>
          </div>
        </Group>
        <Flex gap="md" m="md" mt={0} wrap="wrap">
          {sortKeys.map((item) => (
            <Button
              key={item.key}
              onClick={() => sort(item.key)}
              size="xs"
              variant="light"
              radius="xl"
              rightSection={renderSortIndicator(item.key)}
              style={{ display: "flex" }}
            >
              {item.name}
            </Button>
          ))}
        </Flex>
      </Card>
      <Space h="md" />
      <Flex align="center" justify="space-between" gap="xs">
        <SongCombobox
          value={songId}
          onOptionSubmit={(value) => setSongId(value)}
          style={{ flex: 1 }}
          radius="md"
        />
        <Button radius="md" leftSection={<IconPlus size={20} />} onClick={() => setOpened(true)}>
          创建曲目别名
        </Button>
      </Flex>
      <Space h="xs" />
      <Checkbox
        label="仅显示未被批准的曲目别名"
        defaultChecked={true}
        onChange={() => toggleOnlyNotApproved()}
      />
      <Space h="md" />
      {fetching && totalPages === 0 ? (
        <Group justify="center" mt="md" mb="md">
          <Loader />
        </Group>
      ) : (totalPages === 0 && (
        <Flex gap="xs" align="center" direction="column" c="dimmed" mt="xl" mb="xl">
          <IconDatabaseOff size={64} stroke={1.5} />
          <Text fz="sm">暂时没有可投票的曲目别名</Text>
        </Flex>
      ))}
      <Group justify="center">
        <Pagination total={totalPages} value={page} onChange={setPage} disabled={fetching} />
        <AliasList aliases={aliases} onVote={() => getUserVotesHandler()} onDelete={() => getAliasListHandler(page)} />
        <Pagination total={totalPages} value={page} onChange={setPage} disabled={fetching} />
      </Group>
    </div>
  );
}

export default function AliasVote() {
  return (
    <Page
      meta={{
        title: "曲目别名投票",
        description: "提交曲目别名，或为你喜欢的曲目别名投票",
      }}
      children={<AliasVoteContent />}
    />
  )
}