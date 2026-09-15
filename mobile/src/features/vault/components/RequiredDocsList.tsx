import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RequiredDocumentStatus } from '../models/vault.model';
import { spacing } from '@/core/theme/spacing';

interface RequiredDocsListProps {
  documents: RequiredDocumentStatus[];
  onUploadMissing?: (doc: RequiredDocumentStatus) => void;
}

export const RequiredDocsList: React.FC<RequiredDocsListProps> = ({
  documents,
  onUploadMissing,
}) => {
  const getIconName = (category: string) => {
    switch (category) {
      case 'identity':
        return 'id-card-o';
      case 'bank':
        return 'bank';
      case 'land':
        return 'map-o';
      case 'income':
        return 'file-text-o';
      default:
        return 'file-o';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Required Documents for this Scheme</Text>

      <View style={styles.list}>
        {documents.map((item) => {
          return (
            <View key={item.id} style={styles.docRow}>
              <View style={styles.leftCol}>
                <View
                  style={[
                    styles.iconCircle,
                    item.isUploaded ? styles.iconUploaded : styles.iconMissing,
                  ]}
                >
                  <FontAwesome
                    name={getIconName(item.category) as any}
                    size={15}
                    color={item.isUploaded ? '#047857' : '#DC2626'}
                  />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.docTitle}>{item.name}</Text>
                  <Text style={styles.docSubtitle}>{item.description}</Text>
                </View>
              </View>

              {item.isUploaded ? (
                <View style={styles.uploadedBadge}>
                  <FontAwesome name="check" size={10} color="#15803D" style={{ marginRight: 4 }} />
                  <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.missingBadge}
                  onPress={() => onUploadMissing && onUploadMissing(item)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name="exclamation-circle"
                    size={11}
                    color="#DC2626"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.missingText}>Missing</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.xs,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconUploaded: {
    backgroundColor: '#DCFCE7',
  },
  iconMissing: {
    backgroundColor: '#FEE2E2',
  },
  textCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  uploadedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  missingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
});
