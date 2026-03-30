"use client";

import { Announcement } from "@/lib/system/announcement";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Text,
} from "@chakra-ui/react";

interface Props {
  announcements: Announcement[];
  open: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  Announcement["type"],
  { color: string; label: string }
> = {
  maintenance:  { color: "red",    label: "Maintenance" },
  update:       { color: "blue",   label: "Update" },
  announcement: { color: "purple", label: "Announcement" },
  promo:        { color: "green",  label: "Promo" },
};

function fmtDatetime(dt: string | null) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementPopup({ announcements, open, onClose }: Props) {
  if (!open || announcements.length === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="520px" w="full">

            <Dialog.Header borderBottomWidth="1px" pb={3}>
              <Dialog.Title fontSize="md" fontWeight="semibold">
                System Announcement
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body py={4} maxH="460px" overflowY="auto">
              <Flex direction="column" gap={4}>
                {announcements.map((ann, idx) => {
                  const cfg = TYPE_CONFIG[ann.type] ?? { color: "gray", label: ann.type };
                  const from = fmtDatetime(ann.show_from);
                  const until = fmtDatetime(ann.show_until);

                  return (
                    <Box
                      key={ann.announcement_id}
                      borderWidth="1px"
                      borderRadius="md"
                      p={4}
                      borderLeftWidth="4px"
                      borderLeftColor={`${cfg.color}.400`}
                      bg="gray.50"
                      _dark={{ bg: "gray.800" }}
                    >
                      {/* Type badge + title */}
                      <Flex align="center" gap={2} mb={2}>
                        <Badge color={cfg.color} variant="subtle" fontSize="xs">
                          {cfg.label}
                        </Badge>
                        <Text fontWeight="semibold" fontSize="sm">
                          {ann.title}
                        </Text>
                      </Flex>

                      {/* Message */}
                      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} whiteSpace="pre-line">
                        {ann.message}
                      </Text>

                      {/* Date range */}
                      {(from || until) && (
                        <Text fontSize="xs" color="gray.400" mt={3}>
                          {from && until
                            ? `Active: ${from} — ${until}`
                            : from
                            ? `Active from: ${from}`
                            : `Active until: ${until}`}
                        </Text>
                      )}

                      {/* Divider between items */}
                      {idx < announcements.length - 1 && (
                        <Box mt={4} borderBottomWidth="1px" borderColor="gray.200" />
                      )}
                    </Box>
                  );
                })}
              </Flex>
            </Dialog.Body>

            <Dialog.Footer borderTopWidth="1px" pt={3}>
              <Button bg="#E77A1F" color="white" size="sm" onClick={onClose} cursor="pointer">
                Got it
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" onClick={onClose} />
            </Dialog.CloseTrigger>

          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
