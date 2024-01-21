import { MaimaiScoreProps } from "./Score.tsx";
import {
  Accordion,
  Avatar,
  Badge,
  Box,
  Card, Center,
  Container,
  Group,
  Image, Loader,
  Modal,
  rem,
  Space,
  Text
} from "@mantine/core";
import { getMaimaiScoreCardBackgroundColor, getMaimaiScoreSecondaryColor } from "../../../utils/color.tsx";
import { getDifficulty, MaimaiSongProps } from "../../../utils/api/song/maimai.tsx";
import { useEffect, useState } from "react";
import { fetchAPI } from "../../../utils/api/api.tsx";
import { IconPhotoOff } from "@tabler/icons-react";
import { ScoreHistory } from "./ScoreHistory.tsx";

interface ScoreModalProps {
  score: MaimaiScoreProps | null;
  song: MaimaiSongProps | null;
  opened: boolean;
  onClose: () => void;
}

const ScoreModalContent = ({ score, song }: { score: MaimaiScoreProps, song: MaimaiSongProps }) => {
  return (
    <>
      <Group wrap="nowrap">
        <Avatar src={`https://assets.lxns.net/maimai/jacket/${score.id}.png`} size={94} radius="md">
          <IconPhotoOff />
        </Avatar>
        <div style={{ flex: 1 }}>
          {score.type === "standard" ? (
            <Badge variant="filled" color="blue" size="sm">标准</Badge>
          ) : (
            <Badge variant="filled" color="orange" size="sm">DX</Badge>
          )}
          <Text fz="lg" fw={500} mt={2}>{score.song_name}</Text>
          <Text fz="xs" c="dimmed" mb={2}>谱面 ID：{score.id}</Text>
          <Group gap={0} ml={-3}>
            <Image
              src={`/assets/maimai/music_icon/${score.fc || "blank"}.webp`}
              w={rem(30)}
            />
            <Image
              src={`/assets/maimai/music_icon/${score.fs || "blank"}.webp`}
              w={rem(30)}
            />
          </Group>
        </div>
        <Card w={54} h={38} p={0} radius="md" withBorder style={{
          border: `2px solid ${getMaimaiScoreSecondaryColor(score.level_index || 0)}`,
          backgroundColor: getMaimaiScoreCardBackgroundColor(score.level_index || 0)
        }}>
          <Text size="xl" fw={500} ta="center" c="white" style={{
            lineHeight: rem(34),
          }}>
            {getDifficulty(song, score.type, score.level_index).level_value.toFixed(1)}
          </Text>
        </Card>
      </Group>
      {score.achievements != -1 ? (
        <>
          <Group mt="md">
            <Image
              src={`/assets/maimai/music_rank/${score?.rate}.webp`}
              w={rem(64)}
            />
            <Box>
              <Text fz="xs" c="dimmed">达成率</Text>
              <Text fz={rem(24)} style={{ lineHeight: rem(24) }}>
                {parseInt(String(score.achievements))}
                <span style={{ fontSize: rem(16) }}>.{
                  (String(score?.achievements).split(".")[1] || "0").padEnd(4, "0")
                }%</span>
              </Text>
            </Box>
          </Group>
          <Group mt="md">
            <Box mr={12}>
              <Text fz="xs" c="dimmed">DX Rating</Text>
              <Text fz="md">
                {parseInt(String(score.dx_rating))}
              </Text>
            </Box>
            {score.play_time && (
              <Box mr={12}>
                <Text fz="xs" c="dimmed">游玩时间</Text>
                <Text fz="md">
                  {new Date(score.play_time || "").toLocaleString()}
                </Text>
              </Box>
            )}
            <Box>
              <Text fz="xs" c="dimmed">上传时间</Text>
              <Text fz="md">
                {new Date(score.upload_time || "").toLocaleString()}
              </Text>
            </Box>
          </Group>
        </>
      ) : (
        <Text fz="md" mt="md">
          你还未游玩此谱面，或未上传至查分器。
        </Text>
      )}
    </>
  )
}

export const ScoreModal = ({ score, song, opened, onClose }: ScoreModalProps) => {
  const [scores, setScores] = useState<MaimaiScoreProps[]>([]);
  const [fetching, setFetching] = useState(true);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  }

  const getPlayerScoreHistory = async (score: MaimaiScoreProps) => {
    setFetching(true);
    try {
      const res = await fetchAPI(`user/maimai/player/score/history?song_id=${score.id}&song_type=${score.type}&level_index=${score.level_index}`, {
        method: "GET",
      })
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      setScores(data.data.sort((a: MaimaiScoreProps, b: MaimaiScoreProps) => {
        const uploadTimeDiff = new Date(a.upload_time).getTime() - new Date(b.upload_time).getTime();

        if (uploadTimeDiff === 0 && a.play_time && b.play_time) {
          return new Date(a.play_time).getTime() - new Date(b.play_time).getTime();
        }

        return uploadTimeDiff;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!score) return;

    setScores([]);
    getPlayerScoreHistory(score);
  }, [score]);

  return (
    <Modal.Root opened={opened} onClose={onClose} centered>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>成绩详情</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body p={0}>
          <Container>
            {score !== null && song !== null && (
              <ScoreModalContent score={score} song={song} />
            )}
          </Container>
          <Space h="md" />
          <Accordion chevronPosition="left" variant="filled" radius={0} defaultValue="history">
            <Accordion.Item value="history">
              <Accordion.Control>上传历史记录</Accordion.Control>
              <Accordion.Panel>
                {fetching ? (
                  <Center>
                    <Loader />
                  </Center>
                ) : (
                  <ScoreHistory scores={scores} />
                )}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}