import { StyleSheet } from 'react-native';

export const summaryCardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  editContainer: {
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
  },
  processingContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  noSummaryContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  noSummaryText: {
    fontSize: 15,
    color: '#888',
  },
  actionMenu: {
    position: 'absolute',
    top: 56,
    right: 0,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  actionText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
});
