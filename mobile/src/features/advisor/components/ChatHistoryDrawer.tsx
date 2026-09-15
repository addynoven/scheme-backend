import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import { useAdvisorStore } from '../store/useAdvisorStore';
import type { BackendChatSessionResponse } from '../models/advisor.model';

export function ChatHistoryDrawer() {
  const {
    isHistoryOpen,
    closeHistory,
    sessions,
    currentSessionId,
    selectSession,
    createNewSession,
    deleteSession,
  } = useAdvisorStore();

  const handleNewChat = () => {
    void createNewSession('New Welfare Consultation');
  };

  const handleSelectSession = (item: BackendChatSessionResponse) => {
    const key = item.session_uid || String(item.id);
    void selectSession(key);
  };

  const handleDeleteSession = (item: BackendChatSessionResponse, e: any) => {
    e.stopPropagation?.();
    const key = item.session_uid || String(item.id);
    void deleteSession(key);
  };

  const renderSessionItem = ({ item }: { item: BackendChatSessionResponse }) => {
    const key = item.session_uid || String(item.id);
    const isSelected = key === currentSessionId;
    const dateFormatted = item.created_at
      ? new Intl.DateTimeFormat('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }).format(new Date(item.created_at))
      : '';

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isSelected && styles.sessionCardActive]}
        onPress={() => handleSelectSession(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <FontAwesome
              name={isSelected ? 'comment' : 'comment-o'}
              size={14}
              color={isSelected ? palette.emerald800 : colors.light.textMuted}
            />
            <Text
              style={[styles.sessionTitle, isSelected && styles.sessionTitleActive]}
              numberOfLines={1}
            >
              {item.title || 'Welfare Consultation'}
            </Text>
          </View>
          {dateFormatted ? (
            <Text style={styles.sessionDate}>{dateFormatted}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => handleDeleteSession(item, e)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="trash-o" size={14} color={colors.light.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isHistoryOpen}
      animationType="slide"
      transparent
      onRequestClose={closeHistory}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeHistory}
        />
        <View style={styles.drawerContent}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <FontAwesome name="history" size={18} color={palette.emerald800} />
              <Text style={styles.drawerTitle}>Consultation History</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeHistory}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="times" size={16} color={colors.light.textMuted} />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.newChatText}>Start New Consultation</Text>
          </TouchableOpacity>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="comments-o" size={36} color={colors.light.border} />
              <Text style={styles.emptyTitle}>No past consultations</Text>
              <Text style={styles.emptySubtitle}>
                Your conversations with the Welfare Advisor will be saved here automatically.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.session_uid || String(item.id)}
              renderItem={renderSessionItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drawerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emerald800,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  newChatText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  sessionCardActive: {
    borderColor: palette.emerald600,
    backgroundColor: '#F4FBF7',
  },
  sessionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.light.text,
    flex: 1,
  },
  sessionTitleActive: {
    color: palette.emerald900,
    fontWeight: fontWeights.bold,
  },
  sessionDate: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    marginLeft: 20,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    color: colors.light.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
