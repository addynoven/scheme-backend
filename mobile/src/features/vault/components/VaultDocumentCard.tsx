import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { VaultDocument } from '../models/vault.model';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { toastService } from '@/core/components/Toast';

interface VaultDocumentCardProps {
  document: VaultDocument;
  onDelete?: (id: string) => void;
  onReplace?: (doc: VaultDocument) => void;
}

export const VaultDocumentCard: React.FC<VaultDocumentCardProps> = ({
  document,
  onDelete,
  onReplace,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleView = () => {
    setMenuVisible(false);
    toastService.show(`Viewing ${document.fileName}`, 'info');
  };

  const handleReplace = () => {
    setMenuVisible(false);
    if (onReplace) onReplace(document);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    if (onDelete) onDelete(document.id);
    toastService.show(`${document.title} deleted`, 'info');
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <View style={styles.iconBox}>
          <FontAwesome name="file-pdf-o" size={20} color="#EF4444" />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.subtext}>
            {document.fileName} • {document.fileSize}
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        {document.isVerified && (
          <View style={styles.verifiedBadge}>
            <FontAwesome name="check" size={10} color="#15803D" style={{ marginRight: 3 }} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Document options"
        >
          <FontAwesome name="ellipsis-v" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Options Popup Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>{document.title}</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleView}>
              <FontAwesome name="eye" size={14} color="#334155" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>View Document</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleReplace}>
              <FontAwesome name="refresh" size={14} color="#334155" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Replace File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemDelete]} onPress={handleDelete}>
              <FontAwesome name="trash" size={14} color="#DC2626" style={styles.menuIcon} />
              <Text style={styles.menuDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xs,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  moreBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  menuBox: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  menuIcon: {
    width: 22,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  menuItemDelete: {
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    marginTop: 4,
    paddingTop: spacing.sm,
  },
  menuDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
